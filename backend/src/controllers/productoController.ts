import { Request, Response, NextFunction } from 'express';
import { ProductoService } from '../services/productoService';
import { parsePaginacion } from '../utils/pagination';

export class ProductoController {
  static async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { nombre, precio_unitario } = req.body;

      const producto = await ProductoService.crear(userId, { nombre, precio_unitario });

      res.status(201).json({
        success: true,
        message: 'Producto registrado exitosamente',
        data: producto,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search, incluirInactivos } = req.query;
      const paginacion = parsePaginacion(req, 200, 500);

      const resultado = await ProductoService.listar(
        userId,
        {
          search: search ? String(search) : undefined,
          incluirInactivos: incluirInactivos === 'true',
        },
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

      const producto = await ProductoService.obtenerPorId(userId, id);

      res.status(200).json({
        success: true,
        data: producto,
      });
    } catch (err) {
      next(err);
    }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { nombre, precio_unitario } = req.body;

      const producto = await ProductoService.actualizar(userId, id, { nombre, precio_unitario });

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: producto,
      });
    } catch (err) {
      next(err);
    }
  }

  static async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await ProductoService.desactivar(userId, id);

      res.status(200).json({
        success: true,
        message: 'Producto desactivado exitosamente',
      });
    } catch (err) {
      next(err);
    }
  }

  static async reactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const producto = await ProductoService.reactivar(userId, id);

      res.status(200).json({
        success: true,
        message: 'Producto reactivado exitosamente',
        data: producto,
      });
    } catch (err) {
      next(err);
    }
  }
}
