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
      const { cliente_id, limit, incluirAnulados } = req.query;
      const paginacion = parsePaginacion(req, 50, 200);

      // Por defecto solo se listan abonos vigentes; el historial puede pedir
      // incluir los anulados para mostrar su estado.
      const incluir = incluirAnulados === 'true' || incluirAnulados === '1';

      const resultado = await AbonoService.listarAbonos(
        userId,
        cliente_id ? String(cliente_id) : undefined,
        limit ? parseInt(String(limit), 10) : 50,
        paginacion,
        !incluir
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

  static async anular(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { motivo } = req.body;

      const abono = await AbonoService.anularAbono(userId, id, motivo);

      res.status(200).json({
        success: true,
        message: 'Abono anulado exitosamente',
        data: abono,
      });
    } catch (err) {
      next(err);
    }
  }
}
