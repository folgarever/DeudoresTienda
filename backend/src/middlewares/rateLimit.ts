import { Request, Response, NextFunction } from 'express';

interface Registro {
  count: number;
  reset: number;
}

// Limitador de peticiones sencillo en memoria (suficiente para mitigar
// fuerza bruta en login/registro). Cada instancia serverless mantiene su
// propio contador; para despliegues distribuidos conviene un almacen externo.
const buckets = new Map<string, Registro>();

const MAX_BUCKETS = 5000;

function limpiarBuckets(ahora: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [clave, registro] of buckets) {
    if (ahora > registro.reset) {
      buckets.delete(clave);
    }
  }
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ahora = Date.now();
    limpiarBuckets(ahora);

    const clave = `${req.ip}|${req.method}|${req.baseUrl}${req.path}`;
    const registro = buckets.get(clave);

    if (!registro || ahora > registro.reset) {
      buckets.set(clave, { count: 1, reset: ahora + windowMs });
      next();
      return;
    }

    registro.count += 1;

    if (registro.count > max) {
      const segundos = Math.ceil((registro.reset - ahora) / 1000);
      res.status(429).json({
        success: false,
        message: message || `Demasiadas solicitudes. Vuelva a intentarlo en ${segundos} segundo(s).`,
      });
      return;
    }

    next();
  };
}
