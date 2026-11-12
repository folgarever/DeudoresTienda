import { supabase } from '../config/supabase';
import { RegistrarAbonoDTO, AbonoPago } from '../types/abono';
import { AppError } from '../middlewares/errorHandler';

function createAbonoError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

export class AbonoService {
  static async registrarAbono(userId: string, dto: RegistrarAbonoDTO): Promise<AbonoPago> {
    const clienteId = dto.cliente_id?.trim();
    const monto = Number(dto.monto);
    const observaciones = dto.observaciones?.trim() || null;
    const fecha = dto.fecha ? new Date(dto.fecha).toISOString() : new Date().toISOString();

    if (!clienteId) {
      throw createAbonoError('El cliente es obligatorio para registrar el abono o pago');
    }

    if (isNaN(monto) || monto <= 0) {
      throw createAbonoError('El monto del abono debe ser mayor a Q0.00');
    }

    const montoRedondeado = Math.round(monto * 100) / 100;

    // 1. Intentar registrar a traves de la funcion transaccional RPC de PostgreSQL
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

    // 2. Fallback transaccional seguro
    // Validar cliente y saldo actual
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

    // Insertar registro de abono
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

    // Actualizar saldo del cliente
    await supabase
      .from('clientes')
      .update({
        saldo_pendiente: saldoRestante,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clienteId);

    // Registrar en movimientos_financieros para el historial
    await supabase
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

    return this.obtenerAbonoPorId(userId, nuevoAbono.id);
  }

  static async listarAbonos(userId: string, clienteId?: string, limit: number = 50): Promise<AbonoPago[]> {
    let query = supabase
      .from('abonos_pagos')
      .select('*, cliente:clientes(id, nombre, apellido)')
      .eq('user_id', userId)
      .order('fecha_pago', { ascending: false })
      .limit(limit);

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data: abonos, error } = await query;

    if (error) {
      throw createAbonoError('Error al listar abonos: ' + error.message, 500);
    }

    return (abonos || []).map((a) => ({
      ...a,
      monto: Number(a.monto),
      saldo_anterior: Number(a.saldo_anterior),
      saldo_restante: Number(a.saldo_restante),
    }));
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

    return {
      ...abono,
      monto: Number(abono.monto),
      saldo_anterior: Number(abono.saldo_anterior),
      saldo_restante: Number(abono.saldo_restante),
    };
  }
}
