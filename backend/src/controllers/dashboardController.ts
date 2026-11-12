import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';

export class DashboardController {
  static async obtenerMetricas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const metricas = await DashboardService.obtenerMetricas(userId);

      res.status(200).json({
        success: true,
        data: metricas,
      });
    } catch (err) {
      next(err);
    }
  }
}
