import { supabase } from '../config/supabase';
import { Producto, CrearProductoDTO, ActualizarProductoDTO, FiltroProductosDTO } from '../types/producto';
import { Paginacion } from '../utils/pagination';
import { sanitizeSearchTerm } from '../utils/sanitize';
import { AppError } from '../middlewares/errorHandler';

const MAX_NOMBRE = 150;
const MAX_CATEGORIA = 80;
const MAX_CODIGO = 50;

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

// Normaliza la categoria/codigo opcionales: recorta espacios y convierte
// cadenas vacias en null para no guardar valores en blanco.
function normalizarTextoOpcional(valor: unknown, max: number, etiqueta: string): string | null {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  if (texto.length > max) {
    throw createProductoError(`El ${etiqueta} no puede superar los ${max} caracteres`);
  }
  return texto;
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
    const categoria = normalizarTextoOpcional(dto.categoria, MAX_CATEGORIA, 'categoría');
    const codigo = normalizarTextoOpcional(dto.codigo, MAX_CODIGO, 'código de barras');

    const { data: producto, error } = await supabase
      .from('productos')
      .insert({
        user_id: userId,
        nombre,
        precio_unitario,
        categoria,
        codigo,
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

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.search) {
      const termino = sanitizeSearchTerm(filtros.search);
      if (termino.length > 0) {
        // La busqueda coincide con el nombre o el codigo de barras.
        query = query.or(`nombre.ilike.%${termino}%,codigo.ilike.%${termino}%`);
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

  // Devuelve la lista de categorias distintas registradas por el usuario.
  static async listarCategorias(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('categoria')
      .eq('user_id', userId)
      .eq('activo', true)
      .not('categoria', 'is', null);

    if (error) {
      throw createProductoError('Error al listar categorías: ' + error.message, 500);
    }

    const categorias = new Set<string>();
    for (const fila of data || []) {
      const valor = (fila as { categoria?: string | null }).categoria;
      if (valor) categorias.add(valor);
    }

    return Array.from(categorias).sort((a, b) => a.localeCompare(b, 'es'));
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

    if (dto.categoria !== undefined) {
      cambios.categoria = normalizarTextoOpcional(dto.categoria, MAX_CATEGORIA, 'categoría');
    }

    if (dto.codigo !== undefined) {
      cambios.codigo = normalizarTextoOpcional(dto.codigo, MAX_CODIGO, 'código de barras');
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
