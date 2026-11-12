import { Request, Response, NextFunction } from 'express';
import { AbonoService } from '../services/abonoService';
import { parsePaginacion } from '../utils/pagination';

export class AbonoController {
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { cliente_id, monto, observaciones, fecha } = req.body;

      const abono = await AbonoService.registrarAbono(userId, {
        cliente_id,
        monto,
        observaciones,
        fecha,
      });

      res.status(201).json({
        success: true,
        message: abono.tipo_movimiento === 'PAGO_COMPLETO' ? 'Deuda saldada en su totalidad' : 'Abono registrado exitosamente',
        data: abono,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { cliente_id, limit } = req.query;
      const paginacion = parsePaginacion(req, 50, 200);

      const resultado = await AbonoService.listarAbonos(
        userId,
        cliente_id ? String(cliente_id) : undefined,
        limit ? parseInt(String(limit), 10) : 50,
        paginacion
      );

      res.status(200).json({
        success: true,
        total: resultado.total,
        page: paginacion?.page ?? 1,
        limit: paginacion?.limit ?? resultado.data.length,
        data: resultado.data,
      });
    } catch (err) {
      next(err);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const abono = await AbonoService.obtenerAbonoPorId(userId, id);

      res.status(200).json({
        success: true,
        data: abono,
      });
    } catch (err) {
      next(err);
    }
  }
}
