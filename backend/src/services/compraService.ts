import { supabase } from '../config/supabase';
import { RegistrarCompraDTO, Compra, DetalleCompra, ItemCompraDTO } from '../types/compra';
import { Paginacion } from '../utils/pagination';
import { AppError } from '../middlewares/errorHandler';

const MAX_DESCRIPCION = 255;

function createCompraError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

function normalizarCompra(c: Record<string, unknown>): Compra {
  return {
    ...(c as unknown as Compra),
    total: Number(c.total),
    saldo_generado: Number(c.saldo_generado),
    detalles: ((c.detalles as DetalleCompra[]) || []).map((d) => ({
      ...d,
      cantidad: Number(d.cantidad),
      precio_unitario: Number(d.precio_unitario),
      subtotal: Number(d.subtotal),
    })),
  };
}

// Detecta si el error de la RPC corresponde a que la funcion no existe todavia
// en la base de datos (esquema sin aplicar), caso en el que si procede el fallback.
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

export interface ListarComprasResultado {
  data: Compra[];
  total: number;
}

export class CompraService {
  static async registrarCompra(userId: string, dto: RegistrarCompraDTO): Promise<Compra> {
    const clienteId = dto.cliente_id?.trim();
    const items = dto.items;
    const fecha = dto.fecha ? new Date(dto.fecha).toISOString() : new Date().toISOString();

    if (!clienteId) {
      throw createCompraError('El cliente es obligatorio para registrar la compra');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw createCompraError('La compra debe incluir al menos un producto');
    }

    // Validar y sanear cada producto
    const itemsSaneados: ItemCompraDTO[] = [];
    let totalCalculado = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const descripcion = item.descripcion?.trim();
      const cantidad = Number(item.cantidad);
      const precio_unitario = Number(item.precio_unitario);

      if (!descripcion) {
        throw createCompraError(`El producto en la posición ${i + 1} no tiene descripción`);
      }

      if (descripcion.length > MAX_DESCRIPCION) {
        throw createCompraError(`La descripción del producto en la posición ${i + 1} supera los ${MAX_DESCRIPCION} caracteres`);
      }

      if (isNaN(cantidad) || cantidad <= 0) {
        throw createCompraError(`La cantidad del producto "${descripcion}" debe ser mayor a 0`);
      }

      if (isNaN(precio_unitario) || precio_unitario < 0) {
        throw createCompraError(`El precio del producto "${descripcion}" no puede ser negativo`);
      }

      const subtotal = Math.round(cantidad * precio_unitario * 100) / 100;
      totalCalculado = Math.round((totalCalculado + subtotal) * 100) / 100;

      itemsSaneados.push({
        descripcion,
        cantidad,
        precio_unitario,
      });
    }

    if (totalCalculado <= 0) {
      throw createCompraError('El total de la compra debe ser mayor a Q0.00');
    }

    // 1. Registrar a traves de la funcion transaccional RPC de PostgreSQL
    const { data: rpcData, error: rpcError } = await supabase.rpc('registrar_compra_transaccional', {
      p_user_id: userId,
      p_cliente_id: clienteId,
      p_items: itemsSaneados,
      p_fecha: fecha,
    });

    if (!rpcError && rpcData?.compra_id) {
      return this.obtenerCompraPorId(userId, rpcData.compra_id);
    }

    // Si la RPC existe pero rechazo la operacion por una regla de negocio,
    // se propaga el mensaje original (no se debe enmascarar el error).
    if (rpcError && !esFuncionInexistente(rpcError)) {
      throw createCompraError(rpcError.message || 'No se pudo registrar la compra', 400);
    }

    // 2. Fallback solo cuando la funcion RPC no existe en la base todavia.
    // Se valida de nuevo y se compensan los pasos ante cualquier fallo.
    console.warn('[COMPRA] RPC registrar_compra_transaccional no disponible; usando fallback en Node.js.');

    const { data: cliente, error: errCliente } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, saldo_pendiente, activo')
      .eq('id', clienteId)
      .eq('user_id', userId)
      .maybeSingle();

    if (errCliente || !cliente) {
      throw createCompraError('Cliente no encontrado');
    }

    if (!cliente.activo) {
      throw createCompraError('El cliente seleccionado se encuentra inactivo');
    }

    const saldoAnterior = Number(cliente.saldo_pendiente) || 0;
    const nuevoSaldo = Math.round((saldoAnterior + totalCalculado) * 100) / 100;

    const { data: nuevaCompra, error: errCompra } = await supabase
      .from('compras')
      .insert({
        cliente_id: clienteId,
        user_id: userId,
        total: totalCalculado,
        estado_pago: 'PENDIENTE',
        saldo_generado: totalCalculado,
        fecha_compra: fecha,
      })
      .select('*')
      .single();

    if (errCompra || !nuevaCompra) {
      throw createCompraError('Error al registrar la compra: ' + (errCompra?.message || 'Error desconocido'), 500);
    }

    const detallesParaInsertar = itemsSaneados.map((it) => ({
      compra_id: nuevaCompra.id,
      descripcion_producto: it.descripcion,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      subtotal: Math.round(it.cantidad * it.precio_unitario * 100) / 100,
    }));

    const { error: errDetalles } = await supabase
      .from('detalles_compra')
      .insert(detallesParaInsertar);

    if (errDetalles) {
      // Compensacion: si fallan los detalles, se elimina la cabecera recien creada.
      await supabase.from('compras').delete().eq('id', nuevaCompra.id).eq('user_id', userId);
      throw createCompraError('Error al registrar detalles de la compra: ' + errDetalles.message, 500);
    }

    const { error: errSaldo } = await supabase
      .from('clientes')
      .update({
        saldo_pendiente: nuevoSaldo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clienteId)
      .eq('user_id', userId);

    if (errSaldo) {
      await supabase.from('detalles_compra').delete().eq('compra_id', nuevaCompra.id);
      await supabase.from('compras').delete().eq('id', nuevaCompra.id).eq('user_id', userId);
      throw createCompraError('Error al actualizar el saldo del cliente: ' + errSaldo.message, 500);
    }

    const { error: errMov } = await supabase
      .from('movimientos_financieros')
      .insert({
        cliente_id: clienteId,
        user_id: userId,
        tipo: 'COMPRA',
        referencia_id: nuevaCompra.id,
        descripcion: `Compra de ${itemsSaneados.length} producto(s)`,
        monto: totalCalculado,
        saldo_anterior: saldoAnterior,
        saldo_posterior: nuevoSaldo,
        fecha,
      });

    if (errMov) {
      // La compra ya se aplico; se registra el incidente pero no se revierte
      // el saldo para no descuadrar la contabilidad. Se informa el error.
      console.error('[COMPRA] No se pudo registrar el movimiento financiero:', errMov.message);
    }

    return this.obtenerCompraPorId(userId, nuevaCompra.id);
  }

  static async listarCompras(
    userId: string,
    clienteId?: string,
    limit: number = 50,
    paginacion?: Paginacion | null
  ): Promise<ListarComprasResultado> {
    let query = supabase
      .from('compras')
      .select('*, cliente:clientes(id, nombre, apellido), detalles:detalles_compra(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('fecha_compra', { ascending: false });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    if (paginacion) {
      query = query.range(paginacion.offset, paginacion.offset + paginacion.limit - 1);
    } else {
      query = query.limit(limit);
    }

    const { data: compras, error, count } = await query;

    if (error) {
      throw createCompraError('Error al listar compras: ' + error.message, 500);
    }

    return {
      data: (compras || []).map(normalizarCompra),
      total: count ?? (compras || []).length,
    };
  }

  static async obtenerCompraPorId(userId: string, compraId: string): Promise<Compra> {
    const { data: compra, error } = await supabase
      .from('compras')
      .select('*, cliente:clientes(id, nombre, apellido), detalles:detalles_compra(*)')
      .eq('id', compraId)
      .eq('user_id', userId)
      .single();

    if (error || !compra) {
      throw createCompraError('Compra no encontrada', 404);
    }

    return normalizarCompra(compra);
  }
}
