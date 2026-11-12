import { supabase } from '../config/supabase';
import { ClienteService } from './clienteService';
import { ResumenHistorialCliente, MovimientoFinanciero } from '../types/historial';
import { AppError } from '../middlewares/errorHandler';

function createHistorialError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

export class HistorialService {
  static async obtenerHistorialCliente(userId: string, clienteId: string): Promise<ResumenHistorialCliente> {
    if (!clienteId) {
      throw createHistorialError('El ID del cliente es requerido');
    }

    // 1. Obtener cliente asegurando que pertenece al usuario
    const cliente = await ClienteService.obtenerPorId(userId, clienteId);

    // 2. Obtener compras del cliente para estadisticas
    const { data: compras, error: errCompras } = await supabase
      .from('compras')
      .select('total, fecha_compra')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .order('fecha_compra', { ascending: true });

    if (errCompras) {
      throw createHistorialError('Error al consultar compras del cliente: ' + errCompras.message, 500);
    }

    const totalComprasCount = (compras || []).length;
    let totalDineroComprado = 0;
    let fechaPrimeraCompra: string | null = null;
    let fechaUltimaCompra: string | null = null;

    if (totalComprasCount > 0) {
      fechaPrimeraCompra = compras![0].fecha_compra;
      fechaUltimaCompra = compras![totalComprasCount - 1].fecha_compra;

      for (const c of compras!) {
        totalDineroComprado += Number(c.total) || 0;
      }
      totalDineroComprado = Math.round(totalDineroComprado * 100) / 100;
    }

    // 3. Obtener total dinero abonado
    const { data: abonos, error: errAbonos } = await supabase
      .from('abonos_pagos')
      .select('monto')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId);

    if (errAbonos) {
      throw createHistorialError('Error al consultar abonos del cliente: ' + errAbonos.message, 500);
    }

    let totalDineroAbonado = 0;
    for (const a of abonos || []) {
      totalDineroAbonado += Number(a.monto) || 0;
    }
    totalDineroAbonado = Math.round(totalDineroAbonado * 100) / 100;

    // 4. Obtener movimientos cronologicos unificados
    const { data: movimientos, error: errMov } = await supabase
      .from('movimientos_financieros')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('user_id', userId)
      .order('fecha', { ascending: false });

    if (errMov) {
      throw createHistorialError('Error al consultar movimientos del cliente: ' + errMov.message, 500);
    }

    const movimientosSaneados: MovimientoFinanciero[] = (movimientos || []).map((m) => ({
      ...m,
      monto: Number(m.monto),
      saldo_anterior: Number(m.saldo_anterior),
      saldo_posterior: Number(m.saldo_posterior),
    }));

    return {
      cliente,
      total_compras_count: totalComprasCount,
      total_dinero_comprado: totalDineroComprado,
      total_dinero_abonado: totalDineroAbonado,
      saldo_pendiente_actual: cliente.saldo_pendiente,
      fecha_primera_compra: fechaPrimeraCompra,
      fecha_ultima_compra: fechaUltimaCompra,
      movimientos: movimientosSaneados,
    };
  }
}
