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
  fecha_pago: string;
  created_at?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}
