export interface Producto {
  id: string;
  user_id: string;
  nombre: string;
  precio_unitario: number;
  categoria?: string | null;
  codigo?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearProductoDTO {
  nombre: string;
  precio_unitario: number;
  categoria?: string | null;
  codigo?: string | null;
}

export interface ActualizarProductoDTO {
  nombre?: string;
  precio_unitario?: number;
  categoria?: string | null;
  codigo?: string | null;
}

export interface FiltroProductosDTO {
  search?: string;
  categoria?: string;
  incluirInactivos?: boolean;
}
