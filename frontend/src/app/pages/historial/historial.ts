import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistorialService } from '../../services/historial.service';
import { CompraService } from '../../services/compra.service';
import { Compra, ResumenHistorialCliente } from '../../models';
import { dentroDeRango, fechaCorta, hoyInput, primerDiaMesInput } from '../../core/fecha.utils';
import { descargarCSV, imprimir } from '../../core/exportar.utils';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-app">
      <!-- Encabezado con navegación hacia atrás -->
      <div class="header-section">
        <a routerLink="/clientes" class="back-link">← Volver al listado de clientes</a>

        @if (historial(); as h) {
          <!-- Encabezado visible solo al imprimir (estado de cuenta) -->
          <div class="print-only print-header">
            <div class="print-brand">DeudoresTienda</div>
            <div class="print-title">Estado de Cuenta del Cliente</div>
            <div class="print-meta">
              <span><strong>Cliente:</strong> {{ h.cliente.nombre }} {{ h.cliente.apellido }}</span>
              <span><strong>Emitido:</strong> {{ hoy }}</span>
            </div>
          </div>

          <div class="flex-between client-header mt-12">
            <div>
              <h1 class="page-title">{{ h.cliente.nombre }} {{ h.cliente.apellido }}</h1>
              <p class="text-muted">Historial financiero y cuenta corriente individual</p>
            </div>
            <div class="client-actions no-print">
              <a [routerLink]="['/ventas/nueva']" [queryParams]="{ clienteId: h.cliente.id }" class="btn-uber btn-uber-secondary">
                + Nueva Compra
              </a>
              @if (h.saldo_pendiente_actual > 0) {
                <a [routerLink]="['/abonos/nuevo']" [queryParams]="{ clienteId: h.cliente.id }" class="btn-uber">
                  + Registrar Abono
                </a>
              }
              <button type="button" class="btn-uber btn-uber-outline" (click)="exportarMovimientos()">
                Exportar CSV
              </button>
              <button type="button" class="btn-uber btn-uber-outline" (click)="imprimirEstadoCuenta()">
                Imprimir estado de cuenta
              </button>
            </div>
          </div>
        }
      </div>

      @if (cargando()) {
        <div class="loading-state">
          <p>Cargando historial del cliente...</p>
        </div>
      } @else if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">
          {{ errorMensaje() }}
        </div>
      } @else if (historial(); as h) {
        <!-- Tarjetas de Resumen Financiero del Cliente -->
        <div class="summary-grid">
          <div class="card-uber stat-card" [class.debt-highlight]="h.saldo_pendiente_actual > 0">
            <span class="stat-label">Saldo Pendiente Actual</span>
            <span class="stat-value font-mono">Q{{ h.saldo_pendiente_actual | number:'1.2-2' }}</span>
            <span class="stat-meta">
              {{ h.saldo_pendiente_actual > 0 ? 'Deuda por pagar' : 'Cuenta totalmente saldada' }}
            </span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Total Comprado</span>
            <span class="stat-value font-mono">Q{{ h.total_dinero_comprado | number:'1.2-2' }}</span>
            <span class="stat-meta">{{ h.total_compras_count }} compra(s) registrada(s)</span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Total Abonado</span>
            <span class="stat-value font-mono">Q{{ h.total_dinero_abonado | number:'1.2-2' }}</span>
            <span class="stat-meta">Pagos realizados</span>
          </div>

          <div class="card-uber stat-card">
            <span class="stat-label">Actividad</span>
            <div class="activity-dates">
              <div>
                <span class="text-muted" style="font-size: 11px; text-transform: uppercase;">Primera compra:</span>
                <div class="font-mono font-bold" style="font-size: 13px;">
                  {{ h.fecha_primera_compra ? (h.fecha_primera_compra | date:'dd/MM/yyyy') : 'Sin compras' }}
                </div>
              </div>
              <div class="mt-4">
                <span class="text-muted" style="font-size: 11px; text-transform: uppercase;">Última compra:</span>
                <div class="font-mono font-bold" style="font-size: 13px;">
                  {{ h.fecha_ultima_compra ? (h.fecha_ultima_compra | date:'dd/MM/yyyy') : 'Sin compras' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtro por rango de fechas -->
        <div class="card-uber filters-bar no-print mt-24">
          <div class="filter-field">
            <label class="form-label" for="desde">Desde</label>
            <input id="desde" type="date" class="form-control" [ngModel]="desde()" (ngModelChange)="desde.set($event)" />
          </div>
          <div class="filter-field">
            <label class="form-label" for="hasta">Hasta</label>
            <input id="hasta" type="date" class="form-control" [ngModel]="hasta()" (ngModelChange)="hasta.set($event)" />
          </div>
          <div class="filter-presets">
            <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetMesActual()">Este mes</button>
            <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="presetMesAnterior()">Mes anterior</button>
            <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="limpiarFiltro()">Ver todo</button>
          </div>
          <div class="filter-summary text-muted">
            Mostrando {{ movimientosFiltrados().length }} de {{ historial()?.movimientos?.length || 0 }} movimiento(s)
          </div>
        </div>

        <!-- Detalle de Compras y Productos Anotados -->
        <div class="section-container mt-32">
          <div class="section-header">
            <h2 class="section-title">Compras y Productos Anotados</h2>
            <p class="text-muted">Detalle de cada compra registrada: qué productos llevó, cantidades y precios</p>
          </div>

          @if (cargandoCompras()) {
            <div class="loading-state">
              <p>Cargando compras del cliente...</p>
            </div>
          } @else if (comprasFiltradas().length === 0) {
            <div class="card-uber empty-card">
              <p>{{ hayFiltro() ? 'No hay compras en el rango de fechas seleccionado.' : 'Este cliente aún no tiene compras registradas.' }}</p>
            </div>
          } @else {
            <div class="compras-list">
              @for (c of comprasFiltradas(); track c.id) {
                <div class="card-uber compra-card">
                  <div class="compra-head">
                    <div>
                      <div class="compra-fecha">
                        Compra del {{ c.fecha_compra | date:'dd/MM/yyyy' }}
                        <span class="text-muted">· {{ c.fecha_compra | date:'HH:mm' }}</span>
                      </div>
                      <div class="compra-meta text-muted">
                        {{ (c.detalles?.length || 0) }} producto(s) anotado(s)
                      </div>
                    </div>
                    <div class="compra-right">
                      <span
                        class="badge-uber"
                        [class.badge-saldado]="c.estado_pago === 'PAGADO'"
                        [class.badge-parcial]="c.estado_pago === 'PARCIAL'"
                        [class.badge-deuda]="c.estado_pago === 'PENDIENTE'"
                      >
                        {{ c.estado_pago === 'PAGADO' ? 'Pagado' : (c.estado_pago === 'PARCIAL' ? 'Parcial' : 'Pendiente') }}
                      </span>
                      <span class="compra-total font-mono">Q{{ c.total | number:'1.2-2' }}</span>
                    </div>
                  </div>

                  @if (c.detalles && c.detalles.length > 0) {
                    <div class="table-container mt-12">
                      <table class="table-uber">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th class="text-right">Cantidad</th>
                            <th class="text-right">Precio unitario</th>
                            <th class="text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (d of c.detalles; track d.id) {
                            <tr>
                              <td>{{ d.descripcion_producto }}</td>
                              <td class="text-right font-mono">{{ d.cantidad }}</td>
                              <td class="text-right font-mono">Q{{ d.precio_unitario | number:'1.2-2' }}</td>
                              <td class="text-right font-mono font-bold">Q{{ d.subtotal | number:'1.2-2' }}</td>
                            </tr>
                          }
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="3" class="text-right font-bold">Total de la compra</td>
                            <td class="text-right font-mono font-bold">Q{{ c.total | number:'1.2-2' }}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Tabla Cronológica de Movimientos -->
        <div class="section-container mt-32">
          <div class="section-header">
            <h2 class="section-title">Historial Cronológico de Movimientos</h2>
            <p class="text-muted">Registro inmutable de compras anotadas y abonos efectuados</p>
          </div>

          @if (movimientosFiltrados().length === 0) {
            <div class="card-uber empty-card">
              <p>{{ hayFiltro() ? 'No hay movimientos en el rango de fechas seleccionado.' : 'Este cliente aún no registra movimientos financieros.' }}</p>
            </div>
          } @else {
            <div class="table-container">
              <table class="table-uber">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th class="text-right">Monto</th>
                    <th class="text-right">Saldo Anterior</th>
                    <th class="text-right">Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of movimientosFiltrados(); track m.id) {
                    <tr>
                      <td class="font-mono text-muted" style="font-size: 13px;">
                        {{ m.fecha | date:'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td>
                        @if (m.tipo === 'COMPRA') {
                          <span class="badge-uber badge-deuda">COMPRA</span>
                        } @else {
                          <span class="badge-uber badge-saldado">ABONO</span>
                        }
                      </td>
                      <td>
                        {{ m.descripcion }}
                      </td>
                      <td class="text-right font-mono font-bold" [class.amount-buy]="m.tipo === 'COMPRA'" [class.amount-pay]="m.tipo === 'ABONO'">
                        {{ m.tipo === 'COMPRA' ? '+Q' : '-Q' }}{{ m.monto | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-muted">
                        Q{{ m.saldo_anterior | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono font-bold">
                        Q{{ m.saldo_posterior | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section { margin-bottom: 24px; }
    .back-link { font-size: 13px; text-decoration: underline; color: var(--color-gray-dark); }
    .mt-4 { margin-top: 4px; }
    .mt-12 { margin-top: 12px; }
    .mt-32 { margin-top: 32px; }

    .client-header {
      align-items: flex-start;
    }

    .client-actions {
      display: flex;
      gap: 8px;
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

    .debt-highlight {
      background-color: var(--color-black);
      border-color: var(--color-black);
    }

    .debt-highlight .stat-label,
    .debt-highlight .stat-meta {
      color: #B9B9B9;
    }

    .debt-highlight .stat-value {
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

    .activity-dates {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .section-title {
      font-size: 20px;
      margin-bottom: 2px;
    }

    .section-header {
      margin-bottom: 16px;
    }

    .compras-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .compra-card {
      padding: 18px 20px;
    }

    .compra-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .compra-fecha {
      font-size: 15px;
      font-weight: 600;
    }

    .compra-meta {
      font-size: 13px;
      margin-top: 2px;
    }

    .compra-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .compra-total {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .table-uber tfoot td {
      background-color: var(--color-surface-muted);
      border-top: 1px solid var(--color-gray-border);
      border-bottom: none;
      font-size: 13px;
    }

    .amount-buy {
      color: #000000;
    }

    .amount-pay {
      color: #333333;
    }

    .empty-card {
      text-align: center;
      padding: 32px;
    }

    .filters-bar {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 20px;
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

    .filter-summary {
      margin-left: auto;
      font-size: 13px;
      align-self: center;
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

    .loading-state {
      padding: 48px;
      text-align: center;
      color: var(--color-gray-secondary);
    }

    @media (max-width: 640px) {
      .client-header {
        flex-direction: column;
        gap: 12px;
      }
      .client-actions {
        width: 100%;
      }
      .client-actions .btn-uber {
        flex: 1;
      }
    }
  `]
})
export class HistorialComponent implements OnInit {
  private historialService = inject(HistorialService);
  private compraService = inject(CompraService);
  private route = inject(ActivatedRoute);

  historial = signal<ResumenHistorialCliente | null>(null);
  cargando = signal<boolean>(true);
  errorMensaje = signal<string | null>(null);

  compras = signal<Compra[]>([]);
  cargandoCompras = signal<boolean>(true);

  desde = signal<string>('');
  hasta = signal<string>('');
  hoy = fechaCorta(new Date().toISOString());

  hayFiltro = computed<boolean>(() => !!this.desde() || !!this.hasta());

  movimientosFiltrados = computed(() => {
    const h = this.historial();
    if (!h) return [];
    return h.movimientos.filter((m) => dentroDeRango(m.fecha, this.desde(), this.hasta()));
  });

  comprasFiltradas = computed(() =>
    this.compras().filter((c) => dentroDeRango(c.fecha_compra, this.desde(), this.hasta()))
  );

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const clienteId = params['id'];
      if (clienteId) {
        this.cargarHistorial(clienteId);
        this.cargarCompras(clienteId);
      }
    });
  }

  limpiarFiltro(): void {
    this.desde.set('');
    this.hasta.set('');
  }

  presetMesActual(): void {
    this.desde.set(primerDiaMesInput());
    this.hasta.set(hoyInput());
  }

  presetMesAnterior(): void {
    const d = new Date();
    const inicio = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const fin = new Date(d.getFullYear(), d.getMonth(), 0);
    const fmt = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    this.desde.set(fmt(inicio));
    this.hasta.set(fmt(fin));
  }

  private nombreArchivoCliente(): string {
    const h = this.historial();
    if (!h) return 'cliente';
    return `${h.cliente.nombre} ${h.cliente.apellido}`.trim().replace(/\s+/g, '_');
  }

  exportarMovimientos(): void {
    const movimientos = this.movimientosFiltrados();
    if (movimientos.length === 0) {
      return;
    }

    const filas = movimientos.map((m) => [
      fechaCorta(m.fecha),
      m.tipo,
      m.descripcion,
      m.monto.toFixed(2),
      m.saldo_anterior.toFixed(2),
      m.saldo_posterior.toFixed(2),
    ]);

    descargarCSV(
      `historial_${this.nombreArchivoCliente()}`,
      ['Fecha', 'Tipo', 'Descripcion', 'Monto', 'Saldo anterior', 'Saldo resultante'],
      filas
    );
  }

  imprimirEstadoCuenta(): void {
    imprimir();
  }

  cargarCompras(clienteId: string): void {
    this.cargandoCompras.set(true);
    this.compraService.listar(clienteId, 200).subscribe({
      next: (res) => {
        this.cargandoCompras.set(false);
        if (res.success && res.data) {
          this.compras.set(res.data);
        }
      },
      error: () => {
        this.cargandoCompras.set(false);
        this.compras.set([]);
      }
    });
  }

  cargarHistorial(clienteId: string): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.historialService.obtenerHistorialCliente(clienteId).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.success && res.data) {
          this.historial.set(res.data);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al cargar el historial del cliente');
      }
    });
  }
}
