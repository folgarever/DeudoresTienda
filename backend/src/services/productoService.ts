import { supabase } from '../config/supabase';
import { Producto, CrearProductoDTO, ActualizarProductoDTO, FiltroProductosDTO } from '../types/producto';
import { Paginacion } from '../utils/pagination';
import { sanitizeSearchTerm } from '../utils/sanitize';
import { AppError } from '../middlewares/errorHandler';

const MAX_NOMBRE = 150;

function createProductoError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

function normalizarProducto(p: Record<string, unknown>): Producto {
  return {
    ...(p as unknown as Producto),
    precio_unitario: Number(p.precio_unitario),
  };
}

function validarPrecio(precio: unknown): number {
  const valor = Number(precio);
  if (!Number.isFinite(valor) || valor < 0) {
    throw createProductoError('El precio del producto no puede ser negativo');
  }
  return Math.round(valor * 100) / 100;
}

export interface ListarProductosResultado {
  data: Producto[];
  total: number;
}

export class ProductoService {
  static async crear(userId: string, dto: CrearProductoDTO): Promise<Producto> {
    const nombre = dto.nombre?.trim();

    if (!nombre) {
      throw createProductoError('El nombre del producto es obligatorio');
    }
    if (nombre.length < 2) {
      throw createProductoError('El nombre del producto debe tener al menos 2 caracteres');
    }
    if (nombre.length > MAX_NOMBRE) {
      throw createProductoError(`El nombre del producto no puede superar los ${MAX_NOMBRE} caracteres`);
    }

    const precio_unitario = validarPrecio(dto.precio_unitario ?? 0);

    const { data: producto, error } = await supabase
      .from('productos')
      .insert({
        user_id: userId,
        nombre,
        precio_unitario,
        activo: true,
      })
      .select('*')
      .single();

    if (error || !producto) {
      throw createProductoError('Error al crear el producto: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarProducto(producto);
  }

  static async listar(
    userId: string,
    filtros?: FiltroProductosDTO,
    paginacion?: Paginacion | null
  ): Promise<ListarProductosResultado> {
    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (!filtros?.incluirInactivos) {
      query = query.eq('activo', true);
    }

    if (filtros?.search) {
      const termino = sanitizeSearchTerm(filtros.search);
      if (termino.length > 0) {
        query = query.ilike('nombre', `%${termino}%`);
      }
    }

    query = query.order('nombre', { ascending: true });

    if (paginacion) {
      query = query.range(paginacion.offset, paginacion.offset + paginacion.limit - 1);
    }

    const { data: productos, error, count } = await query;

    if (error) {
      throw createProductoError('Error al listar productos: ' + error.message, 500);
    }

    return {
      data: (productos || []).map(normalizarProducto),
      total: count ?? (productos || []).length,
    };
  }

  static async obtenerPorId(userId: string, productoId: string): Promise<Producto> {
    if (!productoId) {
      throw createProductoError('El ID del producto es requerido');
    }

    const { data: producto, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw createProductoError('Error al consultar producto: ' + error.message, 500);
    }

    if (!producto) {
      throw createProductoError('Producto no encontrado', 404);
    }

    return normalizarProducto(producto);
  }

  static async actualizar(userId: string, productoId: string, dto: ActualizarProductoDTO): Promise<Producto> {
    await this.obtenerPorId(userId, productoId);

    const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (!nombre) {
        throw createProductoError('El nombre del producto es obligatorio');
      }
      if (nombre.length > MAX_NOMBRE) {
        throw createProductoError(`El nombre del producto no puede superar los ${MAX_NOMBRE} caracteres`);
      }
      cambios.nombre = nombre;
    }

    if (dto.precio_unitario !== undefined) {
      cambios.precio_unitario = validarPrecio(dto.precio_unitario);
    }

    const { data: producto, error } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', productoId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !producto) {
      throw createProductoError('Error al actualizar producto: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarProducto(producto);
  }

  static async cambiarEstado(userId: string, productoId: string, activo: boolean): Promise<Producto> {
    await this.obtenerPorId(userId, productoId);

    const { data: producto, error } = await supabase
      .from('productos')
      .update({ activo, updated_at: new Date().toISOString() })
      .eq('id', productoId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !producto) {
      throw createProductoError('Error al actualizar el estado del producto: ' + (error?.message || 'Error desconocido'), 500);
    }

    return normalizarProducto(producto);
  }

  static async desactivar(userId: string, productoId: string): Promise<void> {
    await this.cambiarEstado(userId, productoId, false);
  }

  static async reactivar(userId: string, productoId: string): Promise<Producto> {
    return this.cambiarEstado(userId, productoId, true);
  }
}
