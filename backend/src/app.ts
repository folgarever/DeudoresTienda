import express, { Application, Request, Response, Router } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import clienteRoutes from './routes/clienteRoutes';
import compraRoutes from './routes/compraRoutes';
import abonoRoutes from './routes/abonoRoutes';
import historialRoutes from './routes/historialRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

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

  // Router de API
  const apiRouter = Router();

  // Endpoint de comprobacion de estado (Health Check)
  apiRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'DeudoresTienda API',
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  });

  // Rutas de modulos
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/clientes', clienteRoutes);
  apiRouter.use('/compras', compraRoutes);
  apiRouter.use('/abonos', abonoRoutes);
  apiRouter.use('/historial', historialRoutes);
  apiRouter.use('/dashboard', dashboardRoutes);

  // Compatible tanto con prefijo /api como con rutas directas en Serverless
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // Manejo de rutas no encontradas y errores globales
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
