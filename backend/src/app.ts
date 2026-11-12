import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import clienteRoutes from './routes/clienteRoutes';
import compraRoutes from './routes/compraRoutes';

export function createApp(): Application {
  const app: Application = express();

  // Middlewares globales
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Endpoint de comprobacion de estado (Health Check)
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'DeudoresTienda API',
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  });

  // Rutas de modulos
  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/compras', compraRoutes);

  // Manejo de rutas no encontradas y errores globales
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
