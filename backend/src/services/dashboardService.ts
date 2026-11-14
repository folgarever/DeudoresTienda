import { supabase } from '../config/supabase';
import { CompraService } from './compraService';
import { AbonoService } from './abonoService';
import { DashboardStats, SerieDiaDashboard } from '../types/dashboard';
import { Cliente } from '../types/cliente';
import { AppError } from '../middlewares/errorHandler';

function createDashboardError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

// Devuelve la fecha local (YYYY-MM-DD) de un instante ISO segun el desfase del cliente.
function fechaLocal(iso: string, tzOffset: number): string {
  const d = new Date(new Date(iso).getTime() - tzOffset * 60000);
  return d.toISOString().slice(0, 10);
}

// Genera los ultimos N dias locales (YYYY-MM-DD), terminando en el dia de hoy.
function ultimosDias(dias: number, tzOffset: number): string[] {
  const hoyLocal = fechaLocal(new Date().toISOString(), tzOffset);
  const fin = new Date(`${hoyLocal}T00:00:00.000Z`);
  const lista: string[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    lista.push(new Date(fin.getTime() - i * 86400000).toISOString().slice(0, 10));
  }
  return lista;
}

export interface OpcionesDashboard {
  dias?: number;
  tzOffset?: number;
}

export class DashboardService {
  static async obtenerMetricas(userId: string, opciones?: OpcionesDashboard): Promise<DashboardStats> {
    // Serie temporal: ultimos N dias (por defecto 14, maximo 90) en la zona horaria del cliente.
    const dias = Math.min(Math.max(Math.floor(Number(opciones?.dias)) || 14, 1), 90);
    const tzOffset = Number.isFinite(opciones?.tzOffset) ? Number(opciones!.tzOffset) : 0;
    const mapaSerie = new Map<string, SerieDiaDashboard>();
    for (const dia of ultimosDias(dias, tzOffset)) {
      mapaSerie.set(dia, { fecha: dia, ventas: 0, abonos: 0 });
    }

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

    // 2. Total de compras registradas y monto total vendido (excluyendo anuladas)
    const { data: comprasTotales, error: errCompras } = await supabase
      .from('compras')
      .select('total, fecha_compra')
      .eq('user_id', userId)
      .eq('anulada', false);

    if (errCompras) {
      throw createDashboardError('Error al consultar compras: ' + errCompras.message, 500);
    }

    const totalCompras = (comprasTotales || []).length;
    let totalDineroVendido = 0;
    for (const c of comprasTotales || []) {
      totalDineroVendido += Number(c.total) || 0;
      const dia = fechaLocal(String(c.fecha_compra), tzOffset);
      const entry = mapaSerie.get(dia);
      if (entry) entry.ventas += Number(c.total) || 0;
    }
    totalDineroVendido = Math.round(totalDineroVendido * 100) / 100;

    // 3. Total de dinero abonado (excluyendo anulados)
    const { data: abonos, error: errAbonos } = await supabase
      .from('abonos_pagos')
      .select('monto, fecha_pago')
      .eq('user_id', userId)
      .eq('anulado', false);

    if (errAbonos) {
      throw createDashboardError('Error al consultar abonos: ' + errAbonos.message, 500);
    }

    let totalDineroAbonado = 0;
    for (const a of abonos || []) {
      totalDineroAbonado += Number(a.monto) || 0;
      const dia = fechaLocal(String(a.fecha_pago), tzOffset);
      const entry = mapaSerie.get(dia);
      if (entry) entry.abonos += Number(a.monto) || 0;
    }
    totalDineroAbonado = Math.round(totalDineroAbonado * 100) / 100;

    // 4. Compras recientes (ultimas 5, excluyendo anuladas)
    const comprasRecientes = (await CompraService.listarCompras(userId, undefined, 5, null, true)).data;

    // 5. Ultimos abonos registrados (ultimos 5, excluyendo anulados)
    const ultimosAbonos = (await AbonoService.listarAbonos(userId, undefined, 5, null, true)).data;

    // 6. Serie temporal de los ultimos dias (ventas y abonos por dia local)
    const serieUltimosDias: SerieDiaDashboard[] = Array.from(mapaSerie.values()).map((d) => ({
      fecha: d.fecha,
      ventas: redondear(d.ventas),
      abonos: redondear(d.abonos),
    }));

    return {
      total_clientes: totalClientes,
      clientes_con_deuda: clientesConDeuda,
      total_dinero_por_cobrar: totalDineroPorCobrar,
      total_compras_registradas: totalCompras,
      total_dinero_vendido: totalDineroVendido,
      total_dinero_abonado: totalDineroAbonado,
      compras_recientes: comprasRecientes,
      ultimos_abonos: ultimosAbonos,
      top_deudores: topDeudores,
      serie_ultimos_dias: serieUltimosDias,
    };
  }
}
