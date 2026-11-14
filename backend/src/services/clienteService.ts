import { supabase } from '../config/supabase';
import { Cliente, CrearClienteDTO, ActualizarClienteDTO, FiltroClientesDTO, OrdenClientes } from '../types/cliente';
import { Paginacion } from '../utils/pagination';
import { sanitizeSearchTerm } from '../utils/sanitize';
import { AppError } from '../middlewares/errorHandler';

const MAX_NOMBRE = 100;
const MAX_APELLIDO = 100;
const MAX_NOTAS = 500;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function createClienteError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

// Normaliza las notas: recorta espacios, valida la longitud y convierte el
// texto vacio en NULL para no guardar cadenas en blanco.
function normalizarNotas(notas?: string | null): string | null {
  if (notas === null || notas === undefined) return null;
  const texto = String(notas).trim();
  if (texto.length === 0) return null;
  if (texto.length > MAX_NOTAS) {
    throw createClienteError(`Las notas no pueden superar los ${MAX_NOTAS} caracteres`);
  }
  return texto;
}

function normalizarCliente(c: Record<string, unknown>): Cliente {
  return {
    ...(c as unknown as Cliente),
    saldo_pendiente: Number(c.saldo_pendiente),
  };
}

export interface ListarClientesResultado {
  data: Cliente[];
  total: number;
}

export class ClienteService {
  static async crear(userId: string, dto: CrearClienteDTO): Promise<Cliente> {
    const nombre = dto.nombre?.trim();
    const apellido = dto.apellido?.trim();

    if (!nombre || !apellido) {
      throw createClienteError('El nombre y el apellido del cliente son obligatorios');
    }

    if (nombre.length < 2 || apellido.length < 2) {
      throw createClienteError('El nombre y el apellido deben tener al menos 2 caracteres cada uno');
    }

    if (nombre.length > MAX_NOMBRE || apellido.length > MAX_APELLIDO) {
      throw createClienteError(`El nombre y el apellido no pueden superar los ${MAX_NOMBRE} caracteres`);
    }

    const { data: cliente, error } = await supabase
      .from('clientes')
      .insert({
        user_id: userId,
        nombre,
        apellido,
        notas: normalizarNotas(dto.notas),
        saldo_pendiente: 0.00,
        activo: true,
      })
      .select('*')
      .single();

    if (error || !cliente) {
      throw createClienteError('Error al crear el cliente: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarCliente(cliente);
  }

  static async listar(
    userId: string,
    filtros?: FiltroClientesDTO,
    paginacion?: Paginacion | null
  ): Promise<ListarClientesResultado> {
    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (!filtros?.incluirInactivos) {
      query = query.eq('activo', true);
    }

    if (filtros?.soloConDeuda) {
      query = query.gt('saldo_pendiente', 0);
    }

    if (filtros?.search) {
      const termino = sanitizeSearchTerm(filtros.search);
      if (termino.length > 0) {
        query = query.or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%`);
      }
    }

    query = this.aplicarOrden(query, filtros?.orden);

    if (paginacion) {
      query = query.range(paginacion.offset, paginacion.offset + paginacion.limit - 1);
    }

    const { data: clientes, error, count } = await query;

    if (error) {
      throw createClienteError('Error al listar clientes: ' + error.message, 500);
    }

    const data = (clientes || []).map(normalizarCliente);
    await this.enriquecerConUltimoAbono(userId, data);

    return {
      data,
      total: count ?? data.length,
    };
  }

  // Aplica el criterio de orden solicitado manteniendo un orden estable por nombre.
  private static aplicarOrden(query: any, orden?: OrdenClientes): any {
    switch (orden) {
      case 'saldo':
        return query.order('saldo_pendiente', { ascending: false }).order('nombre', { ascending: true });
      case 'reciente':
        return query.order('created_at', { ascending: false }).order('nombre', { ascending: true });
      case 'nombre':
      default:
        return query.order('nombre', { ascending: true });
    }
  }

  // Agrega a cada cliente la fecha de su ultimo abono y los dias transcurridos.
  // Es un dato auxiliar: si la consulta falla no se interrumpe el listado.
  private static async enriquecerConUltimoAbono(userId: string, clientes: Cliente[]): Promise<void> {
    if (clientes.length === 0) return;

    const ids = clientes.map((c) => c.id);
    const { data: abonos, error } = await supabase
      .from('abonos_pagos')
      .select('cliente_id, fecha_pago')
      .eq('user_id', userId)
      .eq('anulado', false)
      .in('cliente_id', ids)
      .order('fecha_pago', { ascending: false });

    if (error) {
      // Sin la columna de anulacion (esquema sin migrar) se degrada el dato,
      // pero el listado de clientes sigue funcionando.
      for (const c of clientes) {
        c.ultimo_abono = null;
        c.dias_sin_abonar = null;
      }
      return;
    }

    const ultimoPorCliente = new Map<string, string>();
    for (const a of abonos || []) {
      const fila = a as { cliente_id: string; fecha_pago: string };
      if (!ultimoPorCliente.has(fila.cliente_id)) {
        ultimoPorCliente.set(fila.cliente_id, fila.fecha_pago);
      }
    }

    const ahora = Date.now();
    for (const c of clientes) {
      const fecha = ultimoPorCliente.get(c.id) ?? null;
      c.ultimo_abono = fecha;
      c.dias_sin_abonar = fecha ? Math.floor((ahora - new Date(fecha).getTime()) / MS_POR_DIA) : null;
    }
  }

  static async obtenerPorId(userId: string, clienteId: string): Promise<Cliente> {
    if (!clienteId) {
      throw createClienteError('El ID del cliente es requerido');
    }

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw createClienteError('Error al consultar cliente: ' + error.message, 500);
    }

    if (!cliente) {
      throw createClienteError('Cliente no encontrado', 404);
    }

    return normalizarCliente(cliente);
  }

  static async actualizar(userId: string, clienteId: string, dto: ActualizarClienteDTO): Promise<Cliente> {
    const nombre = dto.nombre?.trim();
    const apellido = dto.apellido?.trim();

    if (!nombre || !apellido) {
      throw createClienteError('El nombre y el apellido del cliente son obligatorios');
    }

    if (nombre.length > MAX_NOMBRE || apellido.length > MAX_APELLIDO) {
      throw createClienteError(`El nombre y el apellido no pueden superar los ${MAX_NOMBRE} caracteres`);
    }

    // Verificar existencia del cliente
    await this.obtenerPorId(userId, clienteId);

    const cambios: Record<string, unknown> = {
      nombre,
      apellido,
      updated_at: new Date().toISOString(),
    };

    // Solo se actualizan las notas cuando el cliente las envia, para no borrarlas
    // sin intencion desde llamadas parciales.
    if (dto.notas !== undefined) {
      cambios['notas'] = normalizarNotas(dto.notas);
    }

    const { data: clienteActualizado, error } = await supabase
      .from('clientes')
      .update(cambios)
      .eq('id', clienteId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !clienteActualizado) {
      throw createClienteError('Error al actualizar cliente: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarCliente(clienteActualizado);
  }

  static async cambiarEstado(userId: string, clienteId: string, activo: boolean): Promise<Cliente> {
    // Verificar que el cliente existe y pertenece al usuario
    await this.obtenerPorId(userId, clienteId);

    // Borrado/restauracion logica para preservar la trazabilidad de deudas y pagos
    const { data: cliente, error } = await supabase
      .from('clientes')
      .update({
        activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clienteId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !cliente) {
      throw createClienteError('Error al actualizar el estado del cliente: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarCliente(cliente);
  }

  static async desactivar(userId: string, clienteId: string): Promise<void> {
    await this.cambiarEstado(userId, clienteId, false);
  }

  static async reactivar(userId: string, clienteId: string): Promise<Cliente> {
    return this.cambiarEstado(userId, clienteId, true);
  }
}
