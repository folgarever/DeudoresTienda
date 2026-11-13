// Utilidades de fecha compartidas por las paginas del sistema.
// Se trabaja en hora local del navegador y se envia a la API en ISO (UTC).

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Devuelve la fecha/hora actual en el formato que espera <input type="datetime-local">.
export function ahoraLocalInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Devuelve la fecha actual en el formato que espera <input type="date">.
export function hoyInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Convierte un valor de <input type="datetime-local"> o <input type="date"> a ISO (UTC).
export function aISO(valorLocal: string | null | undefined): string | undefined {
  if (!valorLocal) return undefined;
  const d = new Date(valorLocal);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

// Primer dia del mes actual en formato <input type="date">.
export function primerDiaMesInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

// Formatea una fecha ISO a "dd/mm/aaaa" para mostrar en tablas y reportes.
export function fechaCorta(valor?: string | null): string {
  if (!valor) return '-';
  const d = new Date(valor);
  if (isNaN(d.getTime())) return '-';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Formatea una fecha ISO a "dd/mm/aaaa hh:mm".
export function fechaHora(valor?: string | null): string {
  if (!valor) return '-';
  const d = new Date(valor);
  if (isNaN(d.getTime())) return '-';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Indica si una fecha ISO cae dentro de un rango [desde, hasta] (inclusive).
// Los parametros vacios se interpretan como "sin limite".
export function dentroDeRango(valor: string | null | undefined, desde?: string, hasta?: string): boolean {
  if (!valor) return true;
  const t = new Date(valor).getTime();
  if (isNaN(t)) return true;
  if (desde) {
    const d = new Date(`${desde}T00:00:00`).getTime();
    if (!isNaN(d) && t < d) return false;
  }
  if (hasta) {
    const h = new Date(`${hasta}T23:59:59.999`).getTime();
    if (!isNaN(h) && t > h) return false;
  }
  return true;
}
