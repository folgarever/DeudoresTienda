import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../services/reporte.service';
import { ResumenCaja } from '../../models';
import { fechaCorta, hoyInput, primerDiaMesInput } from '../../core/fecha.utils';
import { descargarCSV, imprimir } from '../../core/exportar.utils';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-app">
      <!-- Encabezado -->
      <div class="header-section">
        <!-- Encabezado visible solo al imprimir -->
        <div class="print-only print-header">
          <div class="print-brand">DeudoresTienda</div>
          <div class="print-title">Cierre de Caja / Resumen de Ventas</div>
          <div class="print-meta">
            <span><strong>Periodo:</strong> {{ resumen() ? (resumen()!.desde | date:'dd/MM/yyyy') : desde() }} – {{ resumen() ? (resumen()!.hasta | date:'dd/MM/yyyy') : hasta() }}</span>
            <span><strong>Emitido:</strong> {{ hoy }}</span>
          </div>
        </div>

        <div class="flex-between">
          <div>
            <h1 class="page-title">Cierre de Caja</h1>
            <p class="text-muted">Resumen de ventas y dinero cobrado por periodo</p>
          </div>
          <div class="header-actions no-print">
            <button type="button" class="btn-uber btn-uber-outline" (click)="exportarCSV()" [disabled]="!resumen()">
              Exportar CSV
            </button>
            <button type="button" class="btn-uber btn-uber-outline" (click)="imprimirReporte()" [disabled]="!resumen()">
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros -->
      <div class="card-uber filters-bar no-print">
        <div class="filter-field">
          <label class="form-label" for="desde">Desde</label>
          <input id="desde" type="date" class="form-control" [ngModel]="desde()" (ngModelChange)="desde.set($event)" />
        </div>
        <div class="filter-field">
          <label class="form-label" for="hasta">Hasta</label>
          <input id="hasta" type="date" class="form-control" [ngModel]="hasta()" (ngModelChange)="hasta.set($event)" />
        </div>
        <div class="filter-presets">
          <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetHoy()">Hoy</button>
          <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetSemana()">Esta semana</button>
          <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetMesActual()">Este mes</button>
          <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetMesAnterior()">Mes anterior</button>
        </div>
        <button type="button" class="btn-uber" (click)="consultar()">Consultar</button>
      </div>

      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">{{ errorMensaje() }}</div>
      }

      @if (cargando()) {
        <div class="loading-state">
          <p>Generando resumen de caja...</p>
        </div>
      } @else if (resumen(); as r) {
        <!-- Tarjetas de resumen -->
        <div class="summary-grid">
          <div class="card-uber stat-card highlight">
            <span class="stat-label">Total Cobrado (Abonos)</span>
            <span class="stat-value font-mono">Q{{ r.total_abonos | number:'1.2-2' }}</span>
            <span class="stat-meta">{{ r.cantidad_abonos }} abono(s) recibido(s)</span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Total Ventas (Facturado)</span>
            <span class="stat-value font-mono">Q{{ r.total_ventas | number:'1.2-2' }}</span>
            <span class="stat-meta">{{ r.cantidad_compras }} compra(s) registrada(s)</span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Promedio por Compra</span>
            <span class="stat-value font-mono">Q{{ r.promedio_venta | number:'1.2-2' }}</span>
            <span class="stat-meta">Ticket promedio</span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Diferencia (Ventas − Abonos)</span>
            <span class="stat-value font-mono">Q{{ r.diferencia | number:'1.2-2' }}</span>
            <span class="stat-meta">Crédito otorgado en el periodo</span>
          </div>
        </div>

        <!-- Desglose diario -->
        <div class="section-container mt-32">
          <div class="section-header">
            <h2 class="section-title">Desglose por Día</h2>
            <p class="text-muted">Detalle diario de ventas y abonos dentro del periodo seleccionado</p>
          </div>

          <div class="table-container">
            <table class="table-uber">
              <thead>
                <tr>
                  <th>Día</th>
                  <th class="text-right">N° Compras</th>
                  <th class="text-right">Ventas (Q)</th>
                  <th class="text-right">N° Abonos</th>
                  <th class="text-right">Abonos (Q)</th>
                  <th class="text-right">Diferencia (Q)</th>
                </tr>
              </thead>
              <tbody>
                @for (d of r.dias; track d.fecha) {
                  <tr [class.row-empty]="d.cantidad_compras === 0 && d.cantidad_abonos === 0">
                    <td class="font-bold">{{ d.fecha | date:'dd/MM/yyyy':'UTC' }}</td>
                    <td class="text-right font-mono">{{ d.cantidad_compras }}</td>
                    <td class="text-right font-mono">Q{{ d.total_ventas | number:'1.2-2' }}</td>
                    <td class="text-right font-mono">{{ d.cantidad_abonos }}</td>
                    <td class="text-right font-mono">Q{{ d.total_abonos | number:'1.2-2' }}</td>
                    <td class="text-right font-mono font-bold">Q{{ (d.total_ventas - d.total_abonos) | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td class="font-bold">Totales</td>
                  <td class="text-right font-mono font-bold">{{ r.cantidad_compras }}</td>
                  <td class="text-right font-mono font-bold">Q{{ r.total_ventas | number:'1.2-2' }}</td>
                  <td class="text-right font-mono font-bold">{{ r.cantidad_abonos }}</td>
                  <td class="text-right font-mono font-bold">Q{{ r.total_abonos | number:'1.2-2' }}</td>
                  <td class="text-right font-mono font-bold">Q{{ r.diferencia | number:'1.2-2' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section { margin-bottom: 24px; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .mt-32 { margin-top: 32px; }

    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .filter-presets {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat-card.highlight {
      background-color: var(--color-black);
      border-color: var(--color-black);
    }

    .stat-card.highlight .stat-label,
    .stat-card.highlight .stat-meta {
      color: #B9B9B9;
    }

    .stat-card.highlight .stat-value {
      color: var(--color-white);
    }

    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-gray-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 700;
    }

    .stat-meta {
      font-size: 13px;
      color: var(--color-gray-secondary);
    }

    .section-header { margin-bottom: 16px; }

    .row-empty td {
      color: var(--color-gray-soft);
    }

    .table-uber tfoot td {
      background-color: var(--color-surface-muted);
      border-top: 1px solid var(--color-gray-border);
      border-bottom: none;
      font-size: 13px;
    }

    .print-header {
      margin-bottom: 18px;
      border-bottom: 2px solid #000000;
      padding-bottom: 10px;
    }

    .print-brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .print-title {
      font-size: 22px;
      font-weight: 700;
      margin: 4px 0 6px;
    }

    .print-meta {
      display: flex;
      gap: 24px;
      font-size: 13px;
    }
  `]
})
export class ReportesComponent implements OnInit {
  private reporteService = inject(ReporteService);

  desde = signal<string>(primerDiaMesInput());
  hasta = signal<string>(hoyInput());
  hoy = fechaCorta(new Date().toISOString());

  resumen = signal<ResumenCaja | null>(null);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    this.consultar();
  }

  private inicioDiaISO(fecha: string): string {
    return new Date(`${fecha}T00:00:00`).toISOString();
  }

  private finDiaISO(fecha: string): string {
    return new Date(`${fecha}T23:59:59.999`).toISOString();
  }

  consultar(): void {
    if (!this.desde() || !this.hasta()) {
      this.errorMensaje.set('Selecciona una fecha inicial y una final');
      return;
    }
    if (this.desde() > this.hasta()) {
      this.errorMensaje.set('La fecha inicial no puede ser posterior a la final');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.reporteService.resumenCaja(this.inicioDiaISO(this.desde()), this.finDiaISO(this.hasta())).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.success && res.data) {
          this.resumen.set(res.data);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al generar el resumen de caja');
      }
    });
  }

  presetHoy(): void {
    this.desde.set(hoyInput());
    this.hasta.set(hoyInput());
    this.consultar();
  }

  presetSemana(): void {
    const d = new Date();
    const dia = d.getDay() === 0 ? 7 : d.getDay(); // lunes = 1
    const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (dia - 1));
    const fmt = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    this.desde.set(fmt(lunes));
    this.hasta.set(hoyInput());
    this.consultar();
  }

  presetMesActual(): void {
    this.desde.set(primerDiaMesInput());
    this.hasta.set(hoyInput());
    this.consultar();
  }

  presetMesAnterior(): void {
    const d = new Date();
    const inicio = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const fin = new Date(d.getFullYear(), d.getMonth(), 0);
    const fmt = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    this.desde.set(fmt(inicio));
    this.hasta.set(fmt(fin));
    this.consultar();
  }

  exportarCSV(): void {
    const r = this.resumen();
    if (!r) return;

    const filas = r.dias.map((d) => [
      d.fecha,
      d.cantidad_compras,
      d.total_ventas.toFixed(2),
      d.cantidad_abonos,
      d.total_abonos.toFixed(2),
      (d.total_ventas - d.total_abonos).toFixed(2),
    ]);

    filas.push([
      'TOTALES',
      r.cantidad_compras,
      r.total_ventas.toFixed(2),
      r.cantidad_abonos,
      r.total_abonos.toFixed(2),
      r.diferencia.toFixed(2),
    ]);

    descargarCSV(
      `cierre_caja_${this.desde()}_a_${this.hasta()}`,
      ['Dia', 'No. compras', 'Ventas (Q)', 'No. abonos', 'Abonos (Q)', 'Diferencia (Q)'],
      filas
    );
  }

  imprimirReporte(): void {
    imprimir();
  }
}
