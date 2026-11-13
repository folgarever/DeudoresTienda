import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { AbonoService } from '../../services/abono.service';
import { Cliente } from '../../models';
import { ahoraLocalInput, aISO } from '../../core/fecha.utils';

@Component({
  selector: 'app-nuevo-abono',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-app">
      <div class="header-section">
        <a routerLink="/clientes" class="back-link">← Volver a clientes</a>
        <h1 class="page-title mt-8">Registrar Abono o Pago</h1>
        <p class="text-muted">Anota el dinero entregado por el cliente para descontar de su deuda pendiente.</p>
      </div>

      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">
          {{ errorMensaje() }}
        </div>
      }

      <div class="form-wrapper">
        <div class="card-uber abono-card">
          <!-- 1. Selección de Cliente -->
          <div class="form-group">
            <label class="form-label" for="cliente">Cliente</label>
            <select
              id="cliente"
              class="form-control"
              [(ngModel)]="clienteSeleccionadoId"
              (change)="onClienteChange()"
            >
              <option value="">-- Selecciona un cliente con deuda --</option>
              @for (c of clientesConDeuda(); track c.id) {
                <option [value]="c.id">
                  {{ c.nombre }} {{ c.apellido }} — Debe: Q{{ c.saldo_pendiente | number:'1.2-2' }}
                </option>
              }
            </select>
          </div>

          @if (clienteSeleccionado(); as cliente) {
            <!-- Panel Informativo de Deuda -->
            <div class="card-uber-light balance-info-box mt-16">
              <div class="flex-between">
                <div>
                  <span class="text-muted" style="font-size: 13px;">Deuda Pendiente Actual:</span>
                  <div class="current-debt font-mono">Q{{ cliente.saldo_pendiente | number:'1.2-2' }}</div>
                </div>
                <button
                  type="button"
                  class="btn-uber btn-sm btn-uber-outline"
                  (click)="pagarDeudaCompleta()"
                >
                  Pagar Deuda Completa
                </button>
              </div>
            </div>

            <!-- 2. Monto a Abonar -->
            <div class="form-group mt-16">
              <label class="form-label" for="monto">Cantidad a Abonar (Q)</label>
              <input
                id="monto"
                type="number"
                step="0.50"
                min="0.01"
                [max]="cliente.saldo_pendiente"
                class="form-control font-mono font-bold"
                style="font-size: 18px;"
                placeholder="0.00"
                [(ngModel)]="montoAbono"
                (input)="calcularSaldoRestante()"
              />
              @if (montoAbono > cliente.saldo_pendiente) {
                <span class="field-error">
                  El monto ingresado no puede superar el saldo adeudado (Q{{ cliente.saldo_pendiente | number:'1.2-2' }}).
                </span>
              }
            </div>

            <!-- Proyección del Saldo Restante -->
            <div class="projection-box mt-16">
              <div class="flex-between projection-line">
                <span class="text-muted">Saldo anterior:</span>
                <span class="font-mono">Q{{ cliente.saldo_pendiente | number:'1.2-2' }}</span>
              </div>
              <div class="flex-between projection-line">
                <span class="text-muted">Abono a descontar:</span>
                <span class="font-mono" style="color: #000000; font-weight: 600;">-Q{{ (montoAbono || 0) | number:'1.2-2' }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="flex-between projection-line total-projection">
                <span class="font-bold">Deuda Restante:</span>
                <span class="font-mono font-bold remaining-balance" [class.paid-off]="saldoRestante() === 0">
                  Q{{ saldoRestante() | number:'1.2-2' }}
                  @if (saldoRestante() === 0 && montoAbono > 0) {
                    <span class="badge-uber badge-saldado" style="margin-left: 6px;">¡DEUDA PAGADA!</span>
                  }
                </span>
              </div>
            </div>

            <!-- Observaciones opcionales -->
            <div class="form-group mt-16">
              <label class="form-label" for="observaciones">Observaciones (Opcional)</label>
              <input
                id="observaciones"
                type="text"
                class="form-control"
                placeholder="Ej. Pago en efectivo, transferencia, etc."
                [(ngModel)]="observaciones"
              />
            </div>

            <!-- Fecha del abono (retroactiva opcional) -->
            <div class="form-group mt-16">
              <label class="form-label" for="fechaAbono">Fecha y hora del abono</label>
              <input
                id="fechaAbono"
                type="datetime-local"
                class="form-control"
                [(ngModel)]="fechaAbono"
              />
              <span class="field-hint text-muted">
                Déjala con la fecha de hoy, o cámbiala si estás anotando un pago recibido en un día anterior.
              </span>
            </div>

            <!-- Botón de Confirmación -->
            <button
              type="button"
              class="btn-uber btn-block mt-24"
              [disabled]="guardando() || montoAbono <= 0 || montoAbono > cliente.saldo_pendiente"
              (click)="guardarAbono()"
            >
              {{ guardando() ? 'Registrando pago...' : 'Confirmar y Guardar Abono' }}
            </button>
          } @else if (clientesConDeuda().length === 0 && !cargando()) {
            <div class="card-uber-light text-center mt-16" style="padding: 24px;">
              <p>No hay clientes con deudas pendientes actualmente.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-section { margin-bottom: 24px; }
    .back-link { font-size: 13px; text-decoration: underline; color: var(--color-gray-dark); }
    .mt-8 { margin-top: 8px; }
    .mt-16 { margin-top: 16px; }
    .mt-24 { margin-top: 24px; }
    .text-center { text-align: center; }

    .field-hint {
      display: block;
      font-size: 12px;
      margin-top: 4px;
      line-height: 1.4;
    }

    .form-wrapper {
      max-width: 540px;
      margin: 0 auto;
    }

    .balance-info-box {
      border: 1px solid var(--color-gray-border);
      padding: 16px;
      border-radius: var(--radius-uber);
    }

    .current-debt {
      font-size: 24px;
      font-weight: 700;
    }

    .field-error {
      font-size: 12px;
      color: #000000;
      font-weight: 600;
      margin-top: 4px;
    }

    .projection-box {
      background-color: var(--color-gray-light);
      border: 1px solid var(--color-gray-border);
      border-radius: var(--radius-uber);
      padding: 16px;
    }

    .projection-line {
      font-size: 14px;
      margin-bottom: 6px;
    }

    .summary-divider {
      height: 1px;
      background-color: var(--color-gray-border);
      margin: 10px 0;
    }

    .total-projection {
      font-size: 16px;
    }

    .remaining-balance {
      font-size: 18px;
    }

    .paid-off {
      color: #000000;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 15px;
    }
  `]
})
export class NuevoAbonoComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private abonoService = inject(AbonoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  clientesConDeuda = signal<Cliente[]>([]);
  clienteSeleccionadoId = '';
  clienteSeleccionado = signal<Cliente | null>(null);

  montoAbono: number = 0;
  saldoRestante = signal<number>(0);
  observaciones = '';
  fechaAbono = ahoraLocalInput();

  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarClientesDeudores();
  }

  cargarClientesDeudores(): void {
    this.cargando.set(true);
    this.clienteService.listar(undefined, true).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.clientesConDeuda.set(res.data || []);

        this.route.queryParams.subscribe((params) => {
          if (params['clienteId']) {
            this.clienteSeleccionadoId = params['clienteId'];
            this.onClienteChange();
          }
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al cargar clientes');
      }
    });
  }

  onClienteChange(): void {
    const cl = this.clientesConDeuda().find((c) => c.id === this.clienteSeleccionadoId);
    this.clienteSeleccionado.set(cl || null);
    this.montoAbono = 0;
    this.calcularSaldoRestante();
  }

  pagarDeudaCompleta(): void {
    const cl = this.clienteSeleccionado();
    if (cl) {
      this.montoAbono = cl.saldo_pendiente;
      this.calcularSaldoRestante();
    }
  }

  calcularSaldoRestante(): void {
    const cl = this.clienteSeleccionado();
    if (!cl) {
      this.saldoRestante.set(0);
      return;
    }

    const anterior = Number(cl.saldo_pendiente) || 0;
    const abono = Number(this.montoAbono) || 0;
    const restante = Math.max(0, Math.round((anterior - abono) * 100) / 100);
    this.saldoRestante.set(restante);
  }

  guardarAbono(): void {
    const cl = this.clienteSeleccionado();
    if (!cl) {
      this.errorMensaje.set('Debes seleccionar un cliente');
      return;
    }

    const monto = Number(this.montoAbono) || 0;

    if (monto <= 0) {
      this.errorMensaje.set('El monto del abono debe ser mayor a Q0.00');
      return;
    }

    if (monto > cl.saldo_pendiente) {
      this.errorMensaje.set('El monto del abono no puede superar la deuda pendiente');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    this.abonoService.registrar({
      cliente_id: cl.id,
      monto,
      observaciones: this.observaciones.trim() || undefined,
      fecha: aISO(this.fechaAbono)
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/clientes', cl.id, 'historial']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al registrar el abono');
      }
    });
  }
}
