import { Request, Response, NextFunction } from 'express';
import { ClienteService } from '../services/clienteService';
import { parsePaginacion } from '../utils/pagination';

export class ClienteController {
  static async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { nombre, apellido, notas } = req.body;

      const cliente = await ClienteService.crear(userId, { nombre, apellido, notas });

      res.status(201).json({
        success: true,
        message: 'Cliente registrado exitosamente',
        data: cliente,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { search, soloConDeuda, incluirInactivos, orden } = req.query;
      const paginacion = parsePaginacion(req, 100, 500);

      const ordenValido = orden === 'saldo' || orden === 'reciente' || orden === 'nombre' ? orden : undefined;

      const resultado = await ClienteService.listar(
        userId,
        {
          search: search ? String(search) : undefined,
          soloConDeuda: soloConDeuda === 'true' || soloConDeuda === '1',
          incluirInactivos: incluirInactivos === 'true' || incluirInactivos === '1',
          orden: ordenValido,
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

      const cliente = await ClienteService.obtenerPorId(userId, id);

      res.status(200).json({
        success: true,
        data: cliente,
      });
    } catch (err) {
      next(err);
    }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { nombre, apellido, notas } = req.body;

      const cliente = await ClienteService.actualizar(userId, id, { nombre, apellido, notas });

      res.status(200).json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: cliente,
      });
    } catch (err) {
      next(err);
    }
  }

  static async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await ClienteService.desactivar(userId, id);

      res.status(200).json({
        success: true,
        message: 'Cliente desactivado exitosamente (conservando su historial)',
      });
    } catch (err) {
      next(err);
    }
  }

  static async reactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const cliente = await ClienteService.reactivar(userId, id);

      res.status(200).json({
        success: true,
        message: 'Cliente reactivado exitosamente',
        data: cliente,
      });
    } catch (err) {
      next(err);
    }
  }
}
