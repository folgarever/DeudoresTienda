export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  activo: boolean;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  saldo_pendiente: number;
  activo: boolean;
  ultimo_abono?: string | null;
  dias_sin_abonar?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type OrdenClientes = 'nombre' | 'saldo' | 'reciente';

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
  anulada?: boolean;
  anulada_at?: string | null;
  motivo_anulacion?: string | null;
  fecha_compra: string;
  created_at?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  detalles?: DetalleCompra[];
}

export interface RegistrarAbonoDTO {
  cliente_id: string;
  monto: number;
  observaciones?: string;
  fecha?: string;
}

export interface AbonoPago {
  id: string;
  cliente_id: string;
  user_id: string;
  monto: number;
  tipo_movimiento: 'ABONO' | 'PAGO_COMPLETO';
  saldo_anterior: number;
  saldo_restante: number;
  observaciones?: string;
  anulado?: boolean;
  anulado_at?: string | null;
  motivo_anulacion?: string | null;
  fecha_pago: string;
  created_at?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface MovimientoFinanciero {
  id: string;
  cliente_id: string;
  user_id: string;
  tipo: 'COMPRA' | 'ABONO' | 'ANULACION_COMPRA' | 'ANULACION_ABONO';
  referencia_id: string;
  descripcion: string;
  monto: number;
  saldo_anterior: number;
  saldo_posterior: number;
  fecha: string;
}

export interface ResumenHistorialCliente {
  cliente: Cliente;
  total_compras_count: number;
  total_dinero_comprado: number;
  total_dinero_abonado: number;
  saldo_pendiente_actual: number;
  fecha_primera_compra: string | null;
  fecha_ultima_compra: string | null;
  movimientos: MovimientoFinanciero[];
}

export interface DashboardStats {
  total_clientes: number;
  clientes_con_deuda: number;
  total_dinero_por_cobrar: number;
  total_compras_registradas: number;
  total_dinero_vendido: number;
  total_dinero_abonado: number;
  compras_recientes: Compra[];
  ultimos_abonos: AbonoPago[];
  top_deudores: Cliente[];
}

export interface ResumenCajaDia {
  fecha: string;
  total_ventas: number;
  total_abonos: number;
  cantidad_compras: number;
  cantidad_abonos: number;
}

export interface ResumenCaja {
  desde: string;
  hasta: string;
  total_ventas: number;
  total_abonos: number;
  cantidad_compras: number;
  cantidad_abonos: number;
  promedio_venta: number;
  diferencia: number;
  dias: ResumenCajaDia[];
}

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
