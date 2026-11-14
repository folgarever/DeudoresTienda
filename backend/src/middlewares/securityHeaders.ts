import { Request, Response, NextFunction } from 'express';

// Cabeceras de seguridad para las respuestas de la API.
//
// La API solo devuelve JSON, por lo que estas cabeceras son defensa en
// profundidad: evitan que el navegador interprete las respuestas como otro
// tipo de contenido (MIME sniffing), que la API se incruste en un marco
// (clickjacking) o que se filtren datos por el encabezado Referer.
//
// Nota: no se define Content-Security-Policy aqui porque la API no sirve HTML;
// la CSP del frontend se configura en vercel.json.
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
}
