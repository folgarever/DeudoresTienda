// Tipos para el reporte de cierre de caja / resumen de ventas.

export interface ResumenCajaDia {
  fecha: string; // YYYY-MM-DD (en la zona horaria del cliente)
  total_ventas: number;
  total_abonos: number;
  cantidad_compras: number;
  cantidad_abonos: number;
}

export interface ResumenCaja {
  desde: string; // ISO de inicio del rango
  hasta: string; // ISO de fin del rango
  total_ventas: number;
  total_abonos: number;
  cantidad_compras: number;
  cantidad_abonos: number;
  promedio_venta: number;
  diferencia: number; // total_ventas - total_abonos
  dias: ResumenCajaDia[];
}

export interface FiltroReporteDTO {
  desde: string;
  hasta: string;
  tzOffset: number; // minutos de desfase respecto a UTC (getTimezoneOffset())
}
