import express, { Application, Request, Response, Router } from 'express';
import cors, { CorsOptions } from 'cors';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import clienteRoutes from './routes/clienteRoutes';
import compraRoutes from './routes/compraRoutes';
import abonoRoutes from './routes/abonoRoutes';
import historialRoutes from './routes/historialRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

export function createApp(): Application {
  const app: Application = express();

  // Detras de un proxy (Vercel) se confia en el primer salto para que req.ip
  // refleje la IP real del cliente. Sin esto, el limitador de intentos
  // agruparia a todos los usuarios bajo la misma IP del proxy.
  app.set('trust proxy', 1);

  // Politica de CORS: si se definen origenes permitidos se aplican;
  // de lo contrario se permite cualquiera (util para desarrollo local).
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (env.CORS_ORIGINS.length === 0 || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
