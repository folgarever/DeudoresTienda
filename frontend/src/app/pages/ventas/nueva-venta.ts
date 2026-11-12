import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { CompraService } from '../../services/compra.service';
import { Cliente, ItemCompraDTO } from '../../models';

@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-app">
      <div class="header-section">
        <a routerLink="/clientes" class="back-link">← Volver a clientes</a>
        <h1 class="page-title mt-8">Registrar Compra / Venta</h1>
        <p class="text-muted">Anota los productos que llevó el cliente. El total se sumará automáticamente a su deuda.</p>
      </div>

      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">
          {{ errorMensaje() }}
        </div>
      }

      <div class="form-grid">
        <!-- Columna Izquierda: Formulario de Selección y Productos -->
        <div class="main-column">
          <!-- 1. Selección de Cliente -->
          <div class="card-uber section-card">
            <h2 class="card-title">1. Seleccionar Cliente</h2>
            <div class="form-group mt-12">
              <label class="form-label" for="cliente">Cliente que realiza la compra</label>
              <select
                id="cliente"
                class="form-control"
                [(ngModel)]="clienteSeleccionadoId"
                (change)="onClienteChange()"
              >
                <option value="">-- Selecciona un cliente --</option>
                @for (c of listaClientes(); track c.id) {
                  <option [value]="c.id">
                    {{ c.nombre }} {{ c.apellido }} (Deuda actual: Q{{ c.saldo_pendiente | number:'1.2-2' }})
                  </option>
                }
              </select>
            </div>
          </div>

          <!-- 2. Agregar Productos -->
          <div class="card-uber section-card mt-16">
            <div class="flex-between">
              <h2 class="card-title">2. Productos Llevados</h2>
              <button type="button" class="btn-uber btn-sm btn-uber-secondary" (click)="agregarProducto()">
                + Agregar otro producto
              </button>
            </div>

            <p class="text-muted" style="font-size: 13px; margin: 8px 0 16px 0;">
              Ingresa el nombre o descripción del producto y su precio unitario en Quetzales.
            </p>

            <div class="items-list">
              @for (item of items(); track $index) {
                <div class="item-row">
                  <div class="item-desc">
                    <label class="form-label">Producto / Descripción</label>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Ej. Gaseosa 2L, Azúcar 2lb, etc."
                      [(ngModel)]="item.descripcion"
                    />
                  </div>

                  <div class="item-qty">
                    <label class="form-label">Cantidad</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      class="form-control font-mono"
                      [(ngModel)]="item.cantidad"
                      (input)="calcularTotal()"
                    />
                  </div>

                  <div class="item-price">
                    <label class="form-label">Precio Unit. (Q)</label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      class="form-control font-mono"
                      [(ngModel)]="item.precio_unitario"
                      (input)="calcularTotal()"
                    />
                  </div>

                  <div class="item-subtotal">
                    <span class="subtotal-label">Subtotal</span>
                    <span class="subtotal-value font-mono">
                      Q{{ (item.cantidad * item.precio_unitario) | number:'1.2-2' }}
                    </span>
                  </div>

                  @if (items().length > 1) {
                    <div class="item-remove">
                      <button
                        type="button"
                        class="btn-remove"
                        (click)="eliminarProducto($index)"
                        title="Eliminar producto"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Resumen de la Venta y Confirmación -->
        <div class="sidebar-column">
          <div class="card-uber summary-card">
            <h2 class="card-title">Resumen de la Compra</h2>

            <div class="summary-details mt-16">
              <div class="summary-line">
                <span class="text-muted">Cliente:</span>
                <span class="font-bold">{{ clienteSeleccionado() ? (clienteSeleccionado()!.nombre + ' ' + clienteSeleccionado()!.apellido) : 'No seleccionado' }}</span>
              </div>

              <div class="summary-line">
                <span class="text-muted">Deuda actual:</span>
                <span class="font-mono">Q{{ (clienteSeleccionado()?.saldo_pendiente || 0) | number:'1.2-2' }}</span>
              </div>

              <div class="summary-line">
                <span class="text-muted">Productos:</span>
                <span>{{ items().length }} producto(s)</span>
              </div>

              <div class="summary-divider"></div>

              <div class="summary-line total-line">
                <span class="font-bold">Total Compra:</span>
                <span class="total-amount font-mono">Q{{ totalCompra() | number:'1.2-2' }}</span>
              </div>

              <div class="summary-line projected-line">
                <span class="text-muted">Nueva Deuda Total:</span>
                <span class="projected-debt font-mono font-bold">
                  Q{{ ((clienteSeleccionado()?.saldo_pendiente || 0) + totalCompra()) | number:'1.2-2' }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="btn-uber btn-block mt-24"
              [disabled]="guardando() || !clienteSeleccionadoId || totalCompra() <= 0"
              (click)="guardarCompra()"
            >
              {{ guardando() ? 'Guardando compra...' : 'Confirmar y Guardar Compra' }}
            </button>

            <p class="summary-disclaimer text-muted mt-12">
              Al confirmar, el total se sumará automáticamente a la cuenta pendiente del cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-section {
      margin-bottom: 24px;
    }
    .back-link {
      font-size: 13px;
      color: var(--color-gray-dark);
      text-decoration: underline;
    }
    .mt-8 { margin-top: 8px; }
    .mt-12 { margin-top: 12px; }
    .mt-16 { margin-top: 16px; }
    .mt-24 { margin-top: 24px; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: flex-start;
    }

    .card-title {
      font-size: 18px;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      padding: 12px;
      background-color: var(--color-gray-light);
      border-radius: var(--radius-uber);
      border: 1px solid var(--color-gray-border);
    }

    .item-desc {
      flex: 3;
    }

    .item-qty {
      flex: 1;
      min-width: 80px;
    }

    .item-price {
      flex: 1.2;
      min-width: 100px;
    }

    .item-subtotal {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      min-width: 90px;
      padding-bottom: 8px;
    }

    .subtotal-label {
      font-size: 11px;
      text-transform: uppercase;
      color: var(--color-gray-secondary);
      font-weight: 600;
    }

    .subtotal-value {
      font-size: 15px;
      font-weight: 700;
    }

    .item-remove {
      padding-bottom: 6px;
    }

    .btn-remove {
      background: none;
      border: 1px solid var(--color-gray-border-dark);
      border-radius: 4px;
      color: var(--color-black);
      cursor: pointer;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-remove:hover {
      background-color: var(--color-black);
      color: var(--color-white);
    }

    .summary-card {
      position: sticky;
      top: 80px;
    }

    .summary-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 14px;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-divider {
      height: 1px;
      background-color: var(--color-gray-border);
      margin: 8px 0;
    }

    .total-line {
      font-size: 18px;
    }

    .total-amount {
      font-size: 22px;
      font-weight: 700;
    }

    .projected-line {
      padding-top: 4px;
    }

    .projected-debt {
      font-size: 16px;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 15px;
    }

    .summary-disclaimer {
      font-size: 12px;
      text-align: center;
    }

    @media (max-width: 860px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .item-row {
        flex-wrap: wrap;
      }
      .item-desc {
        width: 100%;
        flex: none;
      }
    }
  `]
})
export class NuevaVentaComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private compraService = inject(CompraService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  listaClientes = signal<Cliente[]>([]);
  clienteSeleccionadoId = '';
  clienteSeleccionado = signal<Cliente | null>(null);

  items = signal<ItemCompraDTO[]>([
    { descripcion: '', cantidad: 1, precio_unitario: 0 }
  ]);

  totalCompra = signal<number>(0);
  guardando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (res) => {
        this.listaClientes.set(res.data || []);
        // Si viene parametro clienteId en la URL, preseleccionarlo
        this.route.queryParams.subscribe((params) => {
          if (params['clienteId']) {
            this.clienteSeleccionadoId = params['clienteId'];
            this.onClienteChange();
          }
        });
      },
      error: (err) => {
        this.errorMensaje.set('Error al cargar clientes: ' + (err.error?.message || err.message));
      }
    });
  }

  onClienteChange(): void {
    const cl = this.listaClientes().find((c) => c.id === this.clienteSeleccionadoId);
    this.clienteSeleccionado.set(cl || null);
  }

  agregarProducto(): void {
    this.items.update((list) => [
      ...list,
      { descripcion: '', cantidad: 1, precio_unitario: 0 }
    ]);
    this.calcularTotal();
  }

  eliminarProducto(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
    this.calcularTotal();
  }

  calcularTotal(): void {
    let sum = 0;
    for (const it of this.items()) {
      const q = Number(it.cantidad) || 0;
      const p = Number(it.precio_unitario) || 0;
      sum += q * p;
    }
    this.totalCompra.set(Math.round(sum * 100) / 100);
  }

  guardarCompra(): void {
    if (!this.clienteSeleccionadoId) {
      this.errorMensaje.set('Debes seleccionar un cliente');
      return;
    }

    const itemsValidos = this.items().filter((it) => it.descripcion.trim().length > 0 && it.cantidad > 0);
    if (itemsValidos.length === 0) {
      this.errorMensaje.set('Debes ingresar al menos un producto con descripción y cantidad válida');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    this.compraService.registrar({
      cliente_id: this.clienteSeleccionadoId,
      items: itemsValidos
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/clientes', this.clienteSeleccionadoId, 'historial']);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al guardar la compra');
      }
    });
  }
}
