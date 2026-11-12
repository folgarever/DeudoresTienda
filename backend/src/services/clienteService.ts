import { supabase } from '../config/supabase';
import { Cliente, CrearClienteDTO, ActualizarClienteDTO, FiltroClientesDTO } from '../types/cliente';
import { AppError } from '../middlewares/errorHandler';

function createClienteError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
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

    return {
      ...cliente,
      saldo_pendiente: Number(cliente.saldo_pendiente),
    };
  }

  static async listar(userId: string, filtros?: FiltroClientesDTO): Promise<Cliente[]> {
    let query = supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId);

    if (!filtros?.incluirInactivos) {
      query = query.eq('activo', true);
    }

    if (filtros?.soloConDeuda) {
      query = query.gt('saldo_pendiente', 0);
    }

    if (filtros?.search) {
      const termino = filtros.search.trim().toLowerCase();
      query = query.or(`nombre.ilike.%${termino}%,apellido.ilike.%${termino}%`);
    }

    query = query.order('nombre', { ascending: true });

    const { data: clientes, error } = await query;

    if (error) {
      throw createClienteError('Error al listar clientes: ' + error.message, 500);
    }

    return (clientes || []).map((c) => ({
      ...c,
      saldo_pendiente: Number(c.saldo_pendiente),
    }));
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

    return {
      ...cliente,
      saldo_pendiente: Number(cliente.saldo_pendiente),
    };
  }

  static async actualizar(userId: string, clienteId: string, dto: ActualizarClienteDTO): Promise<Cliente> {
    const nombre = dto.nombre?.trim();
    const apellido = dto.apellido?.trim();

    if (!nombre || !apellido) {
      throw createClienteError('El nombre y el apellido del cliente son obligatorios');
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

    return {
      ...clienteActualizado,
      saldo_pendiente: Number(clienteActualizado.saldo_pendiente),
    };
  }

  static async desactivar(userId: string, clienteId: string): Promise<void> {
    // Verificar que el cliente existe y pertenece al usuario
    await this.obtenerPorId(userId, clienteId);

    // Desactivar cliente (borrado logico para preservar trazabilidad de deudas y pagos)
    const { error } = await supabase
      .from('clientes')
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clienteId)
      .eq('user_id', userId);

    if (error) {
      throw createClienteError('Error al desactivar cliente: ' + error.message, 500);
    }
  }
}
