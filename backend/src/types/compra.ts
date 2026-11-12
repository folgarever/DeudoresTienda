export interface ItemCompraDTO {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface RegistrarCompraDTO {
  cliente_id: string;
  items: ItemCompraDTO[];
  fecha?: string;
}

export interface DetalleCompra {
  id: string;
  compra_id: string;
  descripcion_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  cliente_id: string;
  user_id: string;
  total: number;
  estado_pago: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
  saldo_generado: number;
  fecha_compra: string;
  created_at?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  detalles?: DetalleCompra[];
}
