import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  const message = err.message || 'Error interno del servidor';

  if (statusCode === 500) {
    console.error('[ERROR_INTERNO]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}
