// Utilidades para exportar datos a PDF e imprimir reportes.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type FilaPDF = (string | number | null | undefined)[];

export interface OpcionesPDF {
  titulo: string;
  subtitulo?: string;
  nombreArchivo: string;
  encabezados: string[];
  filas: FilaPDF[];
  // Alineacion por indice de columna (por defecto a la izquierda).
  alineaciones?: Record<number, 'left' | 'right' | 'center'>;
}

function normalizar(valor: FilaPDF[number]): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

// Precarga el logo de la app para incrustarlo en los PDF. Si falla, devuelve null
// y el documento se genera igualmente sin el logo.
function cargarLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = 'logo.png';
    } catch {
      resolve(null);
    }
  });
}

// Genera y descarga un PDF con una tabla a partir de los datos indicados.
// Mantiene la identidad monocromatica: encabezado negro y filas alternadas.
export async function descargarPDF(opciones: OpcionesPDF): Promise<void> {
  const { titulo, subtitulo, nombreArchivo, encabezados, filas, alineaciones } = opciones;

  const doc = new jsPDF({
    orientation: encabezados.length > 5 ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margen = 40;
  const anchoPagina = doc.internal.pageSize.getWidth();

  // Logo de la app en la esquina superior derecha (solo en la primera hoja).
  const logo = await cargarLogo();
  if (logo) {
    const tamanoLogo = 34;
    try {
      doc.addImage(logo, 'PNG', anchoPagina - margen - tamanoLogo, 20, tamanoLogo, tamanoLogo);
    } catch {
      // Si el logo no se puede incrustar, se omite sin afectar al documento.
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0);
  doc.text(titulo, margen, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  let cursorY = 66;
  if (subtitulo) {
    doc.text(subtitulo, margen, cursorY);
    cursorY += 15;
  }
  doc.text(`Emitido: ${new Date().toLocaleString('es-GT')}`, margen, cursorY);

  const columnStyles: Record<number, { halign: 'left' | 'right' | 'center' }> = {};
  if (alineaciones) {
    for (const clave of Object.keys(alineaciones)) {
      const idx = Number(clave);
      columnStyles[idx] = { halign: alineaciones[idx] };
    }
  }

  autoTable(doc, {
    head: [encabezados],
    body: filas.map((fila) => fila.map(normalizar)),
    startY: cursorY + 16,
    margin: { left: margen, right: margen },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
      textColor: 20,
      lineColor: [225, 225, 225],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles,
  });

  // Pie de pagina con numeracion en todas las hojas.
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      `DeudoresTienda · Pagina ${i} de ${totalPaginas}`,
      margen,
      doc.internal.pageSize.getHeight() - 20
    );
  }

  const nombre = nombreArchivo.toLowerCase().endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
  doc.save(nombre);
}

// Abre el dialogo de impresion del navegador (usado para estados de cuenta y reportes).
export function imprimir(): void {
  window.print();
}
