import { Request } from 'express';

export interface Paginacion {
  page: number;
  limit: number;
  offset: number;
}

// Interpreta los parametros page/limit de la query string.
// Devuelve null cuando no se solicito paginacion explicita, permitiendo
// conservar el comportamiento de "traer todo" para clientes existentes.
export function parsePaginacion(
  req: Request,
  defaultLimit: number = 50,
  maxLimit: number = 200
): Paginacion | null {
  const { page: pageRaw, limit: limitRaw } = req.query;

  if (pageRaw === undefined && limitRaw === undefined) {
    return null;
  }

  const page = Math.max(1, parseInt(String(pageRaw ?? '1'), 10) || 1);
  const limitSolicitado = parseInt(String(limitRaw ?? defaultLimit), 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, limitSolicitado));

  return { page, limit, offset: (page - 1) * limit };
}
