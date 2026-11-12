import { Request, Response, NextFunction } from 'express';
import { CompraService } from '../services/compraService';
import { parsePaginacion } from '../utils/pagination';

export class CompraController {
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { cliente_id, items, fecha } = req.body;

      const compra = await CompraService.registrarCompra(userId, {
        cliente_id,
        items,
        fecha,
      });

      res.status(201).json({
        success: true,
        message: 'Compra registrada exitosamente',
        data: compra,
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

      const resultado = await CompraService.listarCompras(
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

      const compra = await CompraService.obtenerCompraPorId(userId, id);

      res.status(200).json({
        success: true,
        data: compra,
      });
    } catch (err) {
      next(err);
    }
  }
}
