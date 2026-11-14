import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-app">
      <!-- Encabezado del Dashboard -->
      <div class="flex-between header-section">
        <div>
          <h1 class="page-title">Panel de Control</h1>
          <p class="text-muted">Resumen general y cuentas por cobrar de la tienda</p>
        </div>
        <div class="quick-actions">
          <a routerLink="/ventas/nueva" class="btn-uber">
            + Registrar Compra
          </a>
          <a routerLink="/abonos/nuevo" class="btn-uber btn-uber-secondary">
            + Registrar Abono
          </a>
          <a routerLink="/reportes" class="btn-uber btn-uber-outline">
            Cierre de Caja
          </a>
        </div>
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <p>Cargando información de la tienda...</p>
        </div>
      } @else if (error()) {
        <div class="alert-uber alert-uber-error">
          {{ error() }}
        </div>
      } @else if (stats(); as data) {
        <!-- Tarjetas de Métricas Principales -->
        <div class="stats-grid">
          <div class="card-uber stat-card stat-highlight">
            <div class="stat-top">
              <span class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </span>
              <span class="stat-label">Total por Cobrar</span>
            </div>
            <span class="stat-value font-mono">Q{{ data.total_dinero_por_cobrar | number:'1.2-2' }}</span>
            <span class="stat-meta">{{ data.clientes_con_deuda }} cliente(s) con saldo pendiente</span>
          </div>

          <div class="card-uber stat-card">
            <div class="stat-top">
              <span class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span class="stat-label">Clientes Registrados</span>
            </div>
            <span class="stat-value font-mono">{{ data.total_clientes }}</span>
            <span class="stat-meta">{{ data.clientes_con_deuda }} con deuda / {{ data.total_clientes - data.clientes_con_deuda }} al día</span>
          </div>

          <div class="card-uber stat-card">
            <div class="stat-top">
              <span class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </span>
              <span class="stat-label">Compras Realizadas</span>
            </div>
            <span class="stat-value font-mono">{{ data.total_compras_registradas }}</span>
            <span class="stat-meta">Ventas acumuladas</span>
          </div>

          <div class="card-uber stat-card">
            <div class="stat-top">
              <span class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </span>
              <span class="stat-label">Total Vendido</span>
            </div>
            <span class="stat-value font-mono">Q{{ data.total_dinero_vendido | number:'1.2-2' }}</span>
            <span class="stat-meta">Monto total facturado</span>
          </div>

          <div class="card-uber stat-card">
            <div class="stat-top">
              <span class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </span>
              <span class="stat-label">Total Abonado</span>
            </div>
            <span class="stat-value font-mono">Q{{ data.total_dinero_abonado | number:'1.2-2' }}</span>
            <span class="stat-meta">Dinero recuperado</span>
          </div>
        </div>

        <!-- Gráfica: Ventas y Abonos de los últimos días -->
        @if (serieChart().length > 0) {
          <div class="card-uber chart-card">
            <div class="chart-head">
              <div>
                <h2 class="section-title">Ventas y Abonos (últimos {{ serieChart().length }} días)</h2>
                <p class="text-muted">Comparativa diaria de lo vendido y lo cobrado</p>
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot dot-ventas"></span>Ventas</span>
                <span class="legend-item"><span class="legend-dot dot-abonos"></span>Abonos</span>
              </div>
            </div>
            <div class="chart-bars">
              @for (d of serieChart(); track d.fecha) {
                <div class="chart-col" [title]="d.titulo">
                  <div class="chart-pair">
                    <div class="bar bar-ventas" [style.height.%]="d.ventasPct"></div>
                    <div class="bar bar-abonos" [style.height.%]="d.abonosPct"></div>
                  </div>
                  <span class="chart-label">{{ d.etiqueta }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Seccion: Clientes con Mayor Deuda -->
        <div class="section-container">
          <div class="flex-between section-header">
            <div>
              <h2 class="section-title">Clientes con Mayor Deuda</h2>
              <p class="text-muted">Prioridad de cobro para la administradora</p>
            </div>
            <a routerLink="/clientes" [queryParams]="{ soloConDeuda: 'true' }" class="btn-uber btn-sm btn-uber-outline">
              Ver todos los deudores
            </a>
          </div>

          @if (data.top_deudores.length === 0) {
            <div class="card-uber empty-card">
              <p>¡Excelente! No hay clientes con deudas pendientes en este momento.</p>
            </div>
          } @else {
            <div class="table-container">
              <table class="table-uber">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th class="text-right">Saldo Pendiente</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cliente of data.top_deudores; track cliente.id) {
                    <tr>
                      <td class="font-bold">
                        <a [routerLink]="['/clientes', cliente.id, 'historial']" class="client-link">
                          {{ cliente.nombre }} {{ cliente.apellido }}
                        </a>
                      </td>
                      <td>
                        <span class="badge-uber badge-deuda">Debe</span>
                      </td>
                      <td class="text-right font-mono font-bold debt-text">
                        Q{{ cliente.saldo_pendiente | number:'1.2-2' }}
                      </td>
                      <td class="text-right">
                        <div class="action-buttons">
                          <a [routerLink]="['/abonos/nuevo']" [queryParams]="{ clienteId: cliente.id }" class="btn-uber btn-sm">
                            Abonar
                          </a>
                          <a [routerLink]="['/clientes', cliente.id, 'historial']" class="btn-uber btn-sm btn-uber-secondary">
                            Historial
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Fila doble: Compras Recientes y Últimos Abonos -->
        <div class="two-columns-grid">
          <!-- Compras Recientes -->
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">Compras Recientes</h2>
              <p class="text-muted">Últimas ventas anotadas</p>
            </div>

            @if (data.compras_recientes.length === 0) {
              <div class="card-uber empty-card">
                <p>No se han registrado compras recientemente.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="table-uber">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (compra of data.compras_recientes; track compra.id) {
                      <tr>
                        <td>
                          {{ compra.cliente?.nombre }} {{ compra.cliente?.apellido }}
                        </td>
                        <td class="text-muted font-mono" style="font-size: 13px;">
                          {{ compra.fecha_compra | date:'dd/MM/yyyy HH:mm' }}
                        </td>
                        <td class="text-right font-mono font-bold">
                          +Q{{ compra.total | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Últimos Abonos -->
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">Últimos Abonos</h2>
              <p class="text-muted">Últimos pagos recibidos</p>
            </div>

            @if (data.ultimos_abonos.length === 0) {
              <div class="card-uber empty-card">
                <p>No se han registrado abonos todavía.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="table-uber">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th class="text-right">Abono</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (abono of data.ultimos_abonos; track abono.id) {
                      <tr>
                        <td>
                          {{ abono.cliente?.nombre }} {{ abono.cliente?.apellido }}
                        </td>
                        <td class="text-muted font-mono" style="font-size: 13px;">
                          {{ abono.fecha_pago | date:'dd/MM/yyyy HH:mm' }}
                        </td>
                        <td class="text-right font-mono font-bold" style="color: #000000;">
                          -Q{{ abono.monto | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section {
      margin-bottom: 28px;
    }
    .page-title {
      font-size: 28px;
      margin-bottom: 4px;
    }
    .quick-actions {
      display: flex;
      gap: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .chart-card {
      margin-bottom: 32px;
      padding: 20px;
    }
    .chart-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .chart-head .section-title {
      font-size: 20px;
      margin-bottom: 2px;
    }
    .chart-legend {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--color-gray-secondary);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .dot-ventas {
      background-color: var(--color-black);
    }
    .dot-abonos {
      background-color: #B9B9B9;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 200px;
      padding-top: 8px;
      border-bottom: 1px solid var(--color-gray-border);
      overflow-x: auto;
    }
    .chart-col {
      flex: 1 1 0;
      min-width: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
    .chart-pair {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      width: 100%;
      height: 100%;
    }
    .bar {
      width: 42%;
      max-width: 16px;
      border-radius: 3px 3px 0 0;
      transition: height 0.3s ease;
    }
    .bar-ventas {
      background-color: var(--color-black);
    }
    .bar-abonos {
      background-color: #B9B9B9;
    }
    .chart-label {
      font-size: 11px;
      color: var(--color-gray-secondary);
      white-space: nowrap;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: var(--transition);
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-highlight {
      background-color: var(--color-black);
      border-color: var(--color-black);
      color: var(--color-white);
    }
    .stat-highlight .stat-label,
    .stat-highlight .stat-meta {
      color: #B9B9B9;
    }
    .stat-highlight .stat-value {
      color: var(--color-white);
    }
    .stat-highlight .stat-icon {
      background-color: #1F1F1F;
      color: var(--color-white);
      border-color: #333333;
    }
    .stat-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .stat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      flex: none;
      border-radius: 9px;
      background-color: var(--color-gray-light);
      border: 1px solid var(--color-gray-border);
      color: var(--color-black);
    }
    .stat-icon svg {
      width: 17px;
      height: 17px;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-gray-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 29px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .stat-meta {
      font-size: 13px;
      color: var(--color-gray-secondary);
    }
    .section-container {
      margin-bottom: 32px;
    }
    .section-header {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 20px;
      margin-bottom: 2px;
    }
    .two-columns-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .empty-card {
      text-align: center;
      padding: 32px;
      color: var(--color-gray-secondary);
    }
    .client-link {
      text-decoration: underline;
    }
    .debt-text {
      font-size: 15px;
    }
    .action-buttons {
      display: inline-flex;
      gap: 6px;
    }
    .loading-state {
      padding: 48px;
      text-align: center;
      font-size: 16px;
      color: var(--color-gray-secondary);
    }
    @media (max-width: 860px) {
      .two-columns-grid {
        grid-template-columns: 1fr;
      }
      .quick-actions {
        width: 100%;
      }
      .quick-actions .btn-uber {
        flex: 1;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  // Prepara la serie diaria para la grafica de barras (porcentajes relativos al maximo).
  serieChart = computed(() => {
    const serie = this.stats()?.serie_ultimos_dias ?? [];
    const max = Math.max(1, ...serie.map((d) => Math.max(d.ventas, d.abonos)));
    return serie.map((d) => {
      const fecha = new Date(`${d.fecha}T00:00:00`);
      const etiqueta = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      return {
        fecha: d.fecha,
        etiqueta,
        ventasPct: Math.round((d.ventas / max) * 100),
        abonosPct: Math.round((d.abonos / max) * 100),
        titulo: `${etiqueta} · Ventas: Q${d.ventas.toFixed(2)} · Abonos: Q${d.abonos.toFixed(2)}`,
      };
    });
  });

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.dashboardService.obtenerMetricas().subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.message || 'Error al cargar las métricas del dashboard');
      }
    });
  }
}
