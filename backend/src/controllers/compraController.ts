import { Request, Response, NextFunction } from 'express';
import { CompraService } from '../services/compraService';

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

      const compras = await CompraService.listarCompras(
        userId,
        cliente_id ? String(cliente_id) : undefined,
        limit ? parseInt(String(limit), 10) : 50
      );

      res.status(200).json({
        success: true,
        total: compras.length,
        data: compras,
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
