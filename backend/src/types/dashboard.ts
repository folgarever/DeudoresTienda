import { Cliente } from './cliente';
import { Compra } from './compra';
import { AbonoPago } from './abono';

export interface DashboardStats {
  total_clientes: number;
  clientes_con_deuda: number;
  total_dinero_por_cobrar: number;
  total_compras_registradas: number;
  total_dinero_abonado: number;
  compras_recientes: Compra[];
  ultimos_abonos: AbonoPago[];
  top_deudores: Cliente[];
}
