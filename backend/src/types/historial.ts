import { Cliente } from './cliente';

export interface MovimientoFinanciero {
  id: string;
  cliente_id: string;
  user_id: string;
  tipo: 'COMPRA' | 'ABONO';
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
