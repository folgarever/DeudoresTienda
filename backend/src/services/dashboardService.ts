import { supabase } from '../config/supabase';
import { CompraService } from './compraService';
import { AbonoService } from './abonoService';
import { DashboardStats } from '../types/dashboard';
import { Cliente } from '../types/cliente';
import { AppError } from '../middlewares/errorHandler';

function createDashboardError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

export class DashboardService {
  static async obtenerMetricas(userId: string): Promise<DashboardStats> {
    // 1. Clientes y saldos pendientes
    const { data: clientes, error: errClientes } = await supabase
      .from('clientes')
      .select('id, user_id, nombre, apellido, saldo_pendiente, activo, created_at')
      .eq('user_id', userId)
      .eq('activo', true);

    if (errClientes) {
      throw createDashboardError('Error al consultar clientes para el dashboard: ' + errClientes.message, 500);
    }

    const totalClientes = (clientes || []).length;
    let clientesConDeuda = 0;
    let totalDineroPorCobrar = 0;

    const listaClientes: Cliente[] = (clientes || []).map((c) => {
      const saldo = Number(c.saldo_pendiente) || 0;
      if (saldo > 0) {
        clientesConDeuda++;
        totalDineroPorCobrar += saldo;
      }
      return {
        ...c,
        saldo_pendiente: saldo,
      };
    });

    totalDineroPorCobrar = Math.round(totalDineroPorCobrar * 100) / 100;

    // Top deudores (los 10 clientes con mayor deuda pendiente)
    const topDeudores = listaClientes
      .filter((c) => c.saldo_pendiente > 0)
      .sort((a, b) => b.saldo_pendiente - a.saldo_pendiente)
      .slice(0, 10);

    // 2. Total de compras registradas
    const { count: totalCompras, error: errCountCompras } = await supabase
      .from('compras')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (errCountCompras) {
      throw createDashboardError('Error al contar compras: ' + errCountCompras.message, 500);
    }

    // 3. Total de dinero abonado
    const { data: abonos, error: errAbonos } = await supabase
      .from('abonos_pagos')
      .select('monto')
      .eq('user_id', userId);

    if (errAbonos) {
      throw createDashboardError('Error al consultar abonos: ' + errAbonos.message, 500);
    }

    let totalDineroAbonado = 0;
    for (const a of abonos || []) {
      totalDineroAbonado += Number(a.monto) || 0;
    }
    totalDineroAbonado = Math.round(totalDineroAbonado * 100) / 100;

    // 4. Compras recientes (ultimas 5)
    const comprasRecientes = await CompraService.listarCompras(userId, undefined, 5);

    // 5. Ultimos abonos registrados (ultimos 5)
    const ultimosAbonos = await AbonoService.listarAbonos(userId, undefined, 5);

    return {
      total_clientes: totalClientes,
      clientes_con_deuda: clientesConDeuda,
      total_dinero_por_cobrar: totalDineroPorCobrar,
      total_compras_registradas: totalCompras || 0,
      total_dinero_abonado: totalDineroAbonado,
      compras_recientes: comprasRecientes,
      ultimos_abonos: ultimosAbonos,
      top_deudores: topDeudores,
    };
  }
}
