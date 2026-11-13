import { supabase } from '../config/supabase';
import { RegistrarAbonoDTO, AbonoPago } from '../types/abono';
import { Paginacion } from '../utils/pagination';
import { AppError } from '../middlewares/errorHandler';

function createAbonoError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

// Convierte la fecha opcional enviada por el cliente a ISO (UTC).
// Si el valor recibido no es una fecha valida se rechaza con un error 400.
function parseFecha(valor?: string): string {
  if (!valor) return new Date().toISOString();
  const d = new Date(valor);
  if (isNaN(d.getTime())) {
    throw createAbonoError('La fecha del abono no es valida');
  }
  return d.toISOString();
}

function normalizarAbono(a: Record<string, unknown>): AbonoPago {
  return {
    ...(a as unknown as AbonoPago),
    monto: Number(a.monto),
    saldo_anterior: Number(a.saldo_anterior),
    saldo_restante: Number(a.saldo_restante),
  };
}

function esFuncionInexistente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code || '';
  const message = (error.message || '').toLowerCase();
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  );
}

export interface ListarAbonosResultado {
  data: AbonoPago[];
  total: number;
}

export class AbonoService {
  static async registrarAbono(userId: string, dto: RegistrarAbonoDTO): Promise<AbonoPago> {
    const clienteId = dto.cliente_id?.trim();
    const monto = Number(dto.monto);
    const observaciones = dto.observaciones?.trim() || null;
    const fecha = parseFecha(dto.fecha);

    if (!clienteId) {
      throw createAbonoError('El cliente es obligatorio para registrar el abono o pago');
    }

    if (isNaN(monto) || monto <= 0) {
      throw createAbonoError('El monto del abono debe ser mayor a Q0.00');
    }

    const montoRedondeado = Math.round(monto * 100) / 100;

    // 1. Registrar a traves de la funcion transaccional RPC de PostgreSQL
    const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_abono_transaccional', {
      p_user_id: userId,
      p_cliente_id: clienteId,
      p_monto: montoRedondeado,
      p_observaciones: observaciones,
      p_fecha: fecha,
    });

    if (!rpcError && rpcData?.abono_id) {
      return this.obtenerAbonoPorId(userId, rpcData.abono_id);
    }

    // Si la RPC existe pero rechazo la operacion por una regla de negocio,
    // se propaga el mensaje original.
    if (rpcError && !esFuncionInexistente(rpcError)) {
      throw createAbonoError(rpcError.message || 'No se pudo registrar el abono', 400);
    }

    // 2. Fallback solo cuando la funcion RPC no existe en la base todavia.
    console.warn('[ABONO] RPC registrar_abono_transaccional no disponible; usando fallback en Node.js.');

    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, saldo_pendiente, activo')
      .eq('id', clienteId)
      .eq('user_id', userId)
      .maybeSingle();

    if (errCliente || !cliente) {
      throw createAbonoError('Cliente no encontrado');
    }

    if (!cliente.activo) {
      throw createAbonoError('El cliente seleccionado se encuentra inactivo');
    }

    const saldoAnterior = Math.round((Number(cliente.saldo_pendiente) || 0) * 100) / 100;

    if (saldoAnterior <= 0) {
      throw createAbonoError('El cliente no tiene deuda pendiente para abonar');
    }

    if (montoRedondeado > saldoAnterior) {
      throw createAbonoError(
        `El monto ingresado (Q${montoRedondeado.toFixed(2)}) supera el saldo pendiente del cliente (Q${saldoAnterior.toFixed(2)})`
      );
    }

    const saldoRestante = Math.round((saldoAnterior - montoRedondeado) * 100) / 100;
    const tipoMovimiento = saldoRestante === 0 ? 'PAGO_COMPLETO' : 'ABONO';

    const { data: nuevoAbono, error: errAbono } = await supabase
      .from('abonos_pagos')
      .insert({
        cliente_id: clienteId,
        user_id: userId,
        monto: montoRedondeado,
        tipo_movimiento: tipoMovimiento,
        saldo_anterior: saldoAnterior,
        saldo_restante: saldoRestante,
        observaciones,
        fecha_pago: fecha,
      })
      .select('*')
      .single();

    if (errAbono || !nuevoAbono) {
      throw createAbonoError('Error al registrar el abono: ' + (errAbono?.message || 'Error desconocido'), 500);
    }

    const { error: errSaldo } = await supabase
      .from('clientes')
      .update({
        saldo_pendiente: saldoRestante,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clienteId)
      .eq('user_id', userId);

    if (errSaldo) {
      // Compensacion: se elimina el abono recien creado si no se pudo actualizar el saldo.
      await supabase.from('abonos_pagos').delete().eq('id', nuevoAbono.id).eq('user_id', userId);
      throw createAbonoError('Error al actualizar el saldo del cliente: ' + errSaldo.message, 500);
    }

    const { error: errMov } = await supabase
      .from('movimientos_financieros')
      .insert({
        cliente_id: clienteId,
        user_id: userId,
        tipo: 'ABONO',
        referencia_id: nuevoAbono.id,
        descripcion: tipoMovimiento === 'PAGO_COMPLETO' ? 'Pago completo de deuda' : 'Abono a deuda',
        monto: montoRedondeado,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoRestante,
        fecha,
      });

    if (errMov) {
      console.error('[ABONO] No se pudo registrar el movimiento financiero:', errMov.message);
    }

    // Recalcular el estado de pago de las compras (FIFO) cuando la funcion existe.
    await this.recalcularEstadosPago(userId, clienteId);

    return this.obtenerAbonoPorId(userId, nuevoAbono.id);
  }

  // Actualiza compras.estado_pago (PENDIENTE/PARCIAL/PAGADO) segun los abonos.
  // Si la funcion RPC no existe, el error se ignora silenciosamente para no
  // romper el flujo principal.
  private static async recalcularEstadosPago(userId: string, clienteId: string): Promise<void> {
    const { error } = await supabase.rpc('recalcular_estados_pago_cliente', {
      p_user_id: userId,
      p_cliente_id: clienteId,
    });
    if (error && !esFuncionInexistente(error)) {
      console.error('[ABONO] No se pudo recalcular el estado de pago de las compras:', error.message);
    }
  }

  static async listarAbonos(
    userId: string,
    clienteId?: string,
    limit: number = 50,
    paginacion?: Paginacion | null
  ): Promise<ListarAbonosResultado> {
    let query = supabase
      .from('abonos_pagos')
      .select('*, cliente:clientes(id, nombre, apellido)', { count: 'exact' })
      .eq('user_id', userId)
      .order('fecha_pago', { ascending: false });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    if (paginacion) {
      query = query.range(paginacion.offset, paginacion.offset + paginacion.limit - 1);
    } else {
      query = query.limit(limit);
    }

    const { data: abonos, error, count } = await query;

    if (error) {
      throw createAbonoError('Error al listar abonos: ' + error.message, 500);
    }

    return {
      data: (abonos || []).map(normalizarAbono),
      total: count ?? (abonos || []).length,
    };
  }

  static async obtenerAbonoPorId(userId: string, abonoId: string): Promise<AbonoPago> {
    const { data: abono, error } = await supabase
      .from('abonos_pagos')
      .select('*, cliente:clientes(id, nombre, apellido)')
      .eq('id', abonoId)
      .eq('user_id', userId)
      .single();

    if (error || !abono) {
      throw createAbonoError('Abono o pago no encontrado', 404);
    }

    return normalizarAbono(abono);
  }
}
