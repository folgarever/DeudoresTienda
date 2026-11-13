export interface Producto {
  id: string;
  user_id: string;
  nombre: string;
  precio_unitario: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearProductoDTO {
  nombre: string;
  precio_unitario: number;
}

export interface ActualizarProductoDTO {
  nombre?: string;
  precio_unitario?: number;
}

export interface FiltroProductosDTO {
  search?: string;
  incluirInactivos?: boolean;
}
