import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistorialService } from '../../services/historial.service';
import { ResumenHistorialCliente } from '../../models';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-app">
      <!-- Encabezado con navegación hacia atrás -->
      <div class="header-section">
        <a routerLink="/clientes" class="back-link">← Volver al listado de clientes</a>

        @if (historial(); as h) {
          <div class="flex-between client-header mt-12">
            <div>
              <h1 class="page-title">{{ h.cliente.nombre }} {{ h.cliente.apellido }}</h1>
              <p class="text-muted">Historial financiero y cuenta corriente individual</p>
            </div>
            <div class="client-actions">
              <a [routerLink]="['/ventas/nueva']" [queryParams]="{ clienteId: h.cliente.id }" class="btn-uber btn-uber-secondary">
                + Nueva Compra
              </a>
              @if (h.saldo_pendiente_actual > 0) {
                <a [routerLink]="['/abonos/nuevo']" [queryParams]="{ clienteId: h.cliente.id }" class="btn-uber">
                  + Registrar Abono
                </a>
              }
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

        <!-- Tabla Cronológica de Movimientos -->
        <div class="section-container mt-32">
          <div class="section-header">
            <h2 class="section-title">Historial Cronológico de Movimientos</h2>
            <p class="text-muted">Registro inmutable de compras anotadas y abonos efectuados</p>
          </div>

          @if (h.movimientos.length === 0) {
            <div class="card-uber empty-card">
              <p>Este cliente aún no registra movimientos financieros.</p>
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
                  @for (m of h.movimientos; track m.id) {
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
      background-color: var(--color-gray-light);
      border-color: var(--color-black);
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
  private route = inject(ActivatedRoute);

  historial = signal<ResumenHistorialCliente | null>(null);
  cargando = signal<boolean>(true);
  errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const clienteId = params['id'];
      if (clienteId) {
        this.cargarHistorial(clienteId);
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
