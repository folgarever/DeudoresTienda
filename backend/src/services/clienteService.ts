import { supabase } from '../config/supabase';
import { Cliente, CrearClienteDTO, ActualizarClienteDTO, FiltroClientesDTO } from '../types/cliente';
import { Paginacion } from '../utils/pagination';
import { sanitizeSearchTerm } from '../utils/sanitize';
import { AppError } from '../middlewares/errorHandler';

const MAX_NOMBRE = 100;
const MAX_APELLIDO = 100;

function createClienteError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
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

    query = query.order('nombre', { ascending: true });

    if (paginacion) {
      query = query.range(paginacion.offset, paginacion.offset + paginacion.limit - 1);
    }

    const { data: clientes, error, count } = await query;

    if (error) {
      throw createClienteError('Error al listar clientes: ' + error.message, 500);
    }

    return {
      data: (clientes || []).map(normalizarCliente),
      total: count ?? (clientes || []).length,
    };
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

    const { data: clienteActualizado, error } = await supabase
      .from('clientes')
      .update({
        nombre,
        apellido,
        updated_at: new Date().toISOString(),
      })
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
