import { supabase } from '../config/supabase';
import { ResumenCaja, ResumenCajaDia, FiltroReporteDTO } from '../types/reporte';
import { AppError } from '../middlewares/errorHandler';

function createReporteError(message: string, statusCode: number = 400): AppError {
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

// Genera la lista de dias (YYYY-MM-DD) entre dos fechas locales, inclusive.
function diasEntre(desdeDia: string, hastaDia: string): string[] {
  const dias: string[] = [];
  const cursor = new Date(`${desdeDia}T00:00:00.000Z`);
  const fin = new Date(`${hastaDia}T00:00:00.000Z`);
  while (cursor.getTime() <= fin.getTime()) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dias;
}

export class ReporteService {
  static async obtenerResumenCaja(userId: string, filtro: FiltroReporteDTO): Promise<ResumenCaja> {
    const desde = new Date(filtro.desde);
    const hasta = new Date(filtro.hasta);

    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) {
      throw createReporteError('El rango de fechas no es valido');
    }
    if (desde.getTime() > hasta.getTime()) {
      throw createReporteError('La fecha inicial no puede ser posterior a la final');
    }

    const tzOffset = Number.isFinite(filtro.tzOffset) ? filtro.tzOffset : 0;
    const desdeISO = desde.toISOString();
    const hastaISO = hasta.toISOString();

    // 1. Compras del rango
    const { data: compras, error: errCompras } = await supabase
      .from('compras')
      .select('total, fecha_compra')
      .eq('user_id', userId)
      .gte('fecha_compra', desdeISO)
      .lte('fecha_compra', hastaISO);

    if (errCompras) {
      throw createReporteError('Error al consultar compras: ' + errCompras.message, 500);
    }

    // 2. Abonos del rango
    const { data: abonos, error: errAbonos } = await supabase
      .from('abonos_pagos')
      .select('monto, fecha_pago')
      .eq('user_id', userId)
      .gte('fecha_pago', desdeISO)
      .lte('fecha_pago', hastaISO);

    if (errAbonos) {
      throw createReporteError('Error al consultar abonos: ' + errAbonos.message, 500);
    }

    // 3. Acumuladores
    const mapa = new Map<string, ResumenCajaDia>();
    for (const dia of diasEntre(fechaLocal(desdeISO, tzOffset), fechaLocal(hastaISO, tzOffset))) {
      mapa.set(dia, {
        fecha: dia,
        total_ventas: 0,
        total_abonos: 0,
        cantidad_compras: 0,
        cantidad_abonos: 0,
      });
    }

    let totalVentas = 0;
    let totalAbonos = 0;
    let cantidadCompras = 0;
    let cantidadAbonos = 0;

    for (const c of compras || []) {
      const monto = Number(c.total) || 0;
      totalVentas += monto;
      cantidadCompras++;
      const dia = fechaLocal(String(c.fecha_compra), tzOffset);
      const entry = mapa.get(dia);
      if (entry) {
        entry.total_ventas += monto;
        entry.cantidad_compras++;
      }
    }

    for (const a of abonos || []) {
      const monto = Number(a.monto) || 0;
      totalAbonos += monto;
      cantidadAbonos++;
      const dia = fechaLocal(String(a.fecha_pago), tzOffset);
      const entry = mapa.get(dia);
      if (entry) {
        entry.total_abonos += monto;
        entry.cantidad_abonos++;
      }
    }

    const dias = Array.from(mapa.values()).map((d) => ({
      ...d,
      total_ventas: redondear(d.total_ventas),
      total_abonos: redondear(d.total_abonos),
    }));

    totalVentas = redondear(totalVentas);
    totalAbonos = redondear(totalAbonos);

    return {
      desde: desdeISO,
      hasta: hastaISO,
      total_ventas: totalVentas,
      total_abonos: totalAbonos,
      cantidad_compras: cantidadCompras,
      cantidad_abonos: cantidadAbonos,
      promedio_venta: cantidadCompras > 0 ? redondear(totalVentas / cantidadCompras) : 0,
      diferencia: redondear(totalVentas - totalAbonos),
      dias,
    };
  }
}
