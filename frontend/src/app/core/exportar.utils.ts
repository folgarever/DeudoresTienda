// Utilidades para exportar datos a CSV e imprimir reportes.

export type FilaCSV = (string | number | null | undefined)[];

// Escapa un valor para CSV: comillas dobles internas y separadores.
function escapar(valor: string | number | null | undefined): string {
  const s = valor === null || valor === undefined ? '' : String(valor);
  if (/[";\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Descarga un archivo CSV compatible con Excel en espanol (delimitador ";" y BOM UTF-8).
export function descargarCSV(nombreArchivo: string, encabezados: string[], filas: FilaCSV[]): void {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escapar).join(';'));
  const contenido = '\uFEFF' + lineas.join('\r\n');
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo.toLowerCase().endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Abre el dialogo de impresion del navegador (usado para estados de cuenta y reportes).
export function imprimir(): void {
  window.print();
}
