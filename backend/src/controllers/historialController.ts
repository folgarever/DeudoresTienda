import { Request, Response, NextFunction } from 'express';
import { HistorialService } from '../services/historialService';

export class HistorialController {
  static async obtenerHistorialCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const historial = await HistorialService.obtenerHistorialCliente(userId, id);

      res.status(200).json({
        success: true,
        data: historial,
      });
    } catch (err) {
      next(err);
    }
  }
}
