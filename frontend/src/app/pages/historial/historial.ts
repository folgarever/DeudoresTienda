import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistorialService } from '../../services/historial.service';
import { CompraService } from '../../services/compra.service';
import { AbonoService } from '../../services/abono.service';
import { AbonoPago, Compra, MovimientoFinanciero, ResumenHistorialCliente } from '../../models';
import { dentroDeRango, fechaCorta, hoyInput, primerDiaMesInput } from '../../core/fecha.utils';
import { descargarPDF, imprimir } from '../../core/exportar.utils';

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
                Exportar PDF
              </button>
              <button type="button" class="btn-uber btn-uber-outline" (click)="imprimirEstadoCuenta()">
                Imprimir estado de cuenta
              </button>
            </div>
          </div>
        }
      </div>

      @if (mensajeExito()) {
        <div class="alert-uber no-print">{{ mensajeExito() }}</div>
      }
      @if (avisoError()) {
        <div class="alert-uber alert-uber-error no-print">{{ avisoError() }}</div>
      }

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
                <div class="card-uber compra-card" [class.compra-anulada]="c.anulada">
                  <div class="compra-head">
                    <div>
                      <div class="compra-fecha">
                        Compra del {{ c.fecha_compra | date:'dd/MM/yyyy' }}
                        <span class="text-muted">· {{ c.fecha_compra | date:'HH:mm' }}</span>
                      </div>
                      <div class="compra-meta text-muted">
                        {{ (c.detalles?.length || 0) }} producto(s) anotado(s)
                        @if (c.anulada && c.motivo_anulacion) {
                          · Motivo: {{ c.motivo_anulacion }}
                        }
                      </div>
                    </div>
                    <div class="compra-right">
                      @if (c.anulada) {
                        <span class="badge-uber badge-anulada">ANULADA</span>
                      } @else {
                        <span
                          class="badge-uber"
                          [class.badge-saldado]="c.estado_pago === 'PAGADO'"
                          [class.badge-parcial]="c.estado_pago === 'PARCIAL'"
                          [class.badge-deuda]="c.estado_pago === 'PENDIENTE'"
                        >
                          {{ c.estado_pago === 'PAGADO' ? 'Pagado' : (c.estado_pago === 'PARCIAL' ? 'Parcial' : 'Pendiente') }}
                        </span>
                      }
                      <span class="compra-total font-mono" [class.tachado]="c.anulada">Q{{ c.total | number:'1.2-2' }}</span>
                      @if (!c.anulada) {
                        <button type="button" class="btn-uber btn-sm btn-uber-danger no-print" (click)="anularCompra(c)">
                          Anular
                        </button>
                      }
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
            <p class="text-muted">Registro de compras anotadas, abonos efectuados y sus anulaciones</p>
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
                    <th class="text-right no-print">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of movimientosFiltrados(); track m.id) {
                    <tr [class.row-anulada]="esAnulacion(m)">
                      <td class="font-mono text-muted" style="font-size: 13px;">
                        {{ m.fecha | date:'dd/MM/yyyy HH:mm' }}
                      </td>
                      <td>
                        @if (m.tipo === 'COMPRA') {
                          <span class="badge-uber" [class.badge-deuda]="!estaAnulado(m)" [class.badge-anulada]="estaAnulado(m)">
                            {{ estaAnulado(m) ? 'COMPRA ANULADA' : 'COMPRA' }}
                          </span>
                        } @else if (m.tipo === 'ABONO') {
                          <span class="badge-uber" [class.badge-saldado]="!estaAnulado(m)" [class.badge-anulada]="estaAnulado(m)">
                            {{ estaAnulado(m) ? 'ABONO ANULADO' : 'ABONO' }}
                          </span>
                        } @else {
                          <span class="badge-uber badge-anulada">{{ etiquetaTipo(m) }}</span>
                        }
                      </td>
                      <td>
                        {{ m.descripcion }}
                      </td>
                      <td class="text-right font-mono font-bold" [class.amount-buy]="signoMovimiento(m) === '+'" [class.amount-pay]="signoMovimiento(m) === '-'">
                        {{ signoMovimiento(m) }}Q{{ m.monto | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-muted">
                        Q{{ m.saldo_anterior | number:'1.2-2' }}
                      </td>
                      <td class="text-right font-mono font-bold">
                        Q{{ m.saldo_posterior | number:'1.2-2' }}
                      </td>
                      <td class="text-right no-print">
                        @if (puedeAnular(m)) {
                          <button type="button" class="btn-uber btn-sm btn-uber-danger" (click)="anularMovimiento(m)">
                            Anular
                          </button>
                        } @else {
                          <span class="text-muted">—</span>
                        }
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
    .mt-24 { margin-top: 24px; }
    .mt-32 { margin-top: 32px; }

    .client-header {
      align-items: flex-start;
    }

    .client-actions {
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

    .compra-card.compra-anulada {
      opacity: 0.7;
      border-style: dashed;
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
      flex-wrap: wrap;
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

    .badge-anulada {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      border: 1px solid var(--color-danger-border);
    }

    .tachado {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .row-anulada td {
      opacity: 0.75;
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
  private abonoService = inject(AbonoService);
  private route = inject(ActivatedRoute);

  historial = signal<ResumenHistorialCliente | null>(null);
  cargando = signal<boolean>(true);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  avisoError = signal<string | null>(null);

  compras = signal<Compra[]>([]);
  cargandoCompras = signal<boolean>(true);
  abonos = signal<AbonoPago[]>([]);

  private clienteId = '';

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

  private comprasPorId = computed(() => {
    const mapa = new Map<string, Compra>();
    for (const c of this.compras()) mapa.set(c.id, c);
    return mapa;
  });

  private abonosPorId = computed(() => {
    const mapa = new Map<string, AbonoPago>();
    for (const a of this.abonos()) mapa.set(a.id, a);
    return mapa;
  });

  private temporizadorExito?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const clienteId = params['id'];
      if (clienteId) {
        this.clienteId = clienteId;
        this.cargarHistorial(clienteId);
        this.cargarCompras(clienteId);
        this.cargarAbonos(clienteId);
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

  // --- Estado de los movimientos (para badges y botones de anulación) ---

  estaAnulado(m: MovimientoFinanciero): boolean {
    if (m.tipo === 'COMPRA') return !!this.comprasPorId().get(m.referencia_id)?.anulada;
    if (m.tipo === 'ABONO') return !!this.abonosPorId().get(m.referencia_id)?.anulado;
    return false;
  }

  esAnulacion(m: MovimientoFinanciero): boolean {
    return m.tipo === 'ANULACION_COMPRA' || m.tipo === 'ANULACION_ABONO';
  }

  puedeAnular(m: MovimientoFinanciero): boolean {
    return (m.tipo === 'COMPRA' || m.tipo === 'ABONO') && !this.estaAnulado(m);
  }

  // Signo del monto respecto a la deuda: + incrementa, - reduce.
  signoMovimiento(m: MovimientoFinanciero): string {
    return m.tipo === 'COMPRA' || m.tipo === 'ANULACION_ABONO' ? '+' : '-';
  }

  etiquetaTipo(m: MovimientoFinanciero): string {
    switch (m.tipo) {
      case 'COMPRA':
        return 'COMPRA';
      case 'ABONO':
        return 'ABONO';
      case 'ANULACION_COMPRA':
        return 'ANULACIÓN COMPRA';
      case 'ANULACION_ABONO':
        return 'ANULACIÓN ABONO';
      default:
        return String(m.tipo);
    }
  }

  // --- Anulación de compras y abonos ---

  anularCompra(c: Compra): void {
    const motivo = prompt(
      `¿Anular la compra del ${fechaCorta(c.fecha_compra)} por Q${c.total.toFixed(2)}?\n\n` +
        'El monto se devolverá a la deuda del cliente. Puedes escribir un motivo (opcional):',
      ''
    );
    if (motivo === null) return;

    this.avisoError.set(null);
    this.compraService.anular(c.id, motivo.trim() || undefined).subscribe({
      next: () => {
        this.mostrarExito('Compra anulada. El monto volvió a la deuda del cliente.');
        this.recargarTodo();
      },
      error: (err) => this.avisoError.set(err.error?.message || 'Error al anular la compra')
    });
  }

  anularMovimiento(m: MovimientoFinanciero): void {
    if (m.tipo === 'COMPRA') {
      const compra = this.comprasPorId().get(m.referencia_id);
      if (compra) {
        this.anularCompra(compra);
        return;
      }
    }

    if (m.tipo === 'ABONO') {
      const abono = this.abonosPorId().get(m.referencia_id);
      const etiqueta = abono ? `Q${abono.monto.toFixed(2)}` : 'este abono';
      const motivo = prompt(
        `¿Anular el abono de ${etiqueta}?\n\n` +
          'El monto volverá a sumarse a la deuda del cliente. Puedes escribir un motivo (opcional):',
        ''
      );
      if (motivo === null) return;

      this.avisoError.set(null);
      this.abonoService.anular(m.referencia_id, motivo.trim() || undefined).subscribe({
        next: () => {
          this.mostrarExito('Abono anulado. El monto volvió a la deuda del cliente.');
          this.recargarTodo();
        },
        error: (err) => this.avisoError.set(err.error?.message || 'Error al anular el abono')
      });
    }
  }

  private recargarTodo(): void {
    if (!this.clienteId) return;
    this.cargarHistorial(this.clienteId);
    this.cargarCompras(this.clienteId);
    this.cargarAbonos(this.clienteId);
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    if (this.temporizadorExito) clearTimeout(this.temporizadorExito);
    this.temporizadorExito = setTimeout(() => this.mensajeExito.set(null), 4000);
  }

  // --- Exportación e impresión ---

  private nombreArchivoCliente(): string {
    const h = this.historial();
    if (!h) return 'cliente';
    return `${h.cliente.nombre} ${h.cliente.apellido}`.trim().replace(/\s+/g, '_');
  }

  exportarMovimientos(): void {
    const movimientos = this.movimientosFiltrados();
    if (movimientos.length === 0) {
      this.avisoError.set('No hay movimientos para exportar con el rango de fechas actual.');
      return;
    }

    const h = this.historial();
    const cliente = h ? `${h.cliente.nombre} ${h.cliente.apellido}` : '';

    const filas = movimientos.map((m) => [
      fechaCorta(m.fecha),
      this.etiquetaTipo(m),
      m.descripcion,
      `${this.signoMovimiento(m)}${m.monto.toFixed(2)}`,
      m.saldo_anterior.toFixed(2),
      m.saldo_posterior.toFixed(2),
    ]);

    descargarPDF({
      titulo: 'Historial de Movimientos',
      subtitulo: `${cliente}${this.hayFiltro() ? ` · ${this.desde() || 'inicio'} a ${this.hasta() || 'hoy'}` : ''}`,
      nombreArchivo: `historial_${this.nombreArchivoCliente()}`,
      encabezados: ['Fecha', 'Tipo', 'Descripción', 'Monto (Q)', 'Saldo anterior', 'Saldo resultante'],
      filas,
      alineaciones: { 3: 'right', 4: 'right', 5: 'right' },
    });
  }

  imprimirEstadoCuenta(): void {
    imprimir();
  }

  cargarAbonos(clienteId: string): void {
    this.abonoService.listar(clienteId, 200, true).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.abonos.set(res.data);
        }
      },
      error: () => this.abonos.set([])
    });
  }

  cargarCompras(clienteId: string): void {
    this.cargandoCompras.set(true);
    this.compraService.listar(clienteId, 200, true).subscribe({
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
