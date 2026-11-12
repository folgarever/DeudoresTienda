// Utilidades de saneamiento de entrada.
//
// Los filtros de PostgREST (usados por @supabase/supabase-js en metodos como
// .or() y .ilike()) se construyen como cadenas de texto. Si un valor provisto
// por el usuario contiene caracteres separadores (coma, parentesis) o barras
// invertidas, es posible manipular la consulta. Estas funciones eliminan dichos
// caracteres antes de interpolarlos.

export function sanitizeFilterValue(valor: unknown): string {
  return String(valor ?? '')
    .replace(/[,()\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sanea un termino de busqueda para usarlo dentro de un patron ilike.
// Conserva los comodines de escritura (los agregamos nosotros) pero elimina
// los separadores de filtros de PostgREST.
export function sanitizeSearchTerm(valor: unknown): string {
  return sanitizeFilterValue(valor);
}
