import { Request, Response, NextFunction } from 'express';
import { ReporteService } from '../services/reporteService';

export class ReporteController {
  static async resumenCaja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { desde, hasta, tzOffset } = req.query;

      const resumen = await ReporteService.obtenerResumenCaja(userId, {
        desde: String(desde ?? ''),
        hasta: String(hasta ?? ''),
        tzOffset: Number(tzOffset ?? 0),
      });

      res.status(200).json({
        success: true,
        data: resumen,
      });
    } catch (err) {
      next(err);
    }
  }
}
