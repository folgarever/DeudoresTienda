import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-app">
      <!-- Encabezado -->
      <div class="flex-between header-section">
        <div>
          <h1 class="page-title">Catálogo de Productos</h1>
          <p class="text-muted">Guarda tus productos frecuentes con su precio para agilizar las ventas</p>
        </div>
        <button class="btn-uber" (click)="abrirModalCrear()">
          + Nuevo Producto
        </button>
      </div>

      <!-- Búsqueda -->
      <div class="card-uber filters-card">
        <div class="search-box">
          <input
            type="text"
            class="form-control"
            placeholder="Buscar producto por nombre..."
            [(ngModel)]="terminoBusqueda"
            (input)="onBuscar()"
          />
        </div>
        <label class="checkbox-label">
          <input type="checkbox" [(ngModel)]="incluirInactivos" (change)="onBuscar()" />
          Mostrar productos inactivos
        </label>
      </div>

      @if (mensajeExito()) {
        <div class="alert-uber">{{ mensajeExito() }}</div>
      }
      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">{{ errorMensaje() }}</div>
      }

      @if (cargando()) {
        <div class="loading-state">
          <p>Cargando catálogo de productos...</p>
        </div>
      } @else if (productos().length === 0) {
        <div class="card-uber empty-card">
          <p>No hay productos registrados todavía.</p>
          <button class="btn-uber btn-sm mt-12" (click)="abrirModalCrear()">
            Registrar primer producto
          </button>
        </div>
      } @else {
        <div class="table-container">
          <table class="table-uber">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th class="text-right">Precio Unitario</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (p of productos(); track p.id) {
                <tr [class.row-inactivo]="!p.activo">
                  <td class="font-bold">{{ p.nombre }}</td>
                  <td>
                    @if (p.activo) {
                      <span class="badge-uber badge-saldado">Activo</span>
                    } @else {
                      <span class="badge-uber badge-inactivo">Inactivo</span>
                    }
                  </td>
                  <td class="text-right font-mono font-bold">Q{{ p.precio_unitario | number:'1.2-2' }}</td>
                  <td class="text-right">
                    <div class="action-buttons">
                      <button class="btn-uber btn-sm btn-uber-secondary" (click)="abrirModalEditar(p)">
                        Editar
                      </button>
                      @if (p.activo) {
                        <button class="btn-uber btn-sm btn-uber-danger" (click)="desactivarProducto(p)" title="Desactivar producto">
                          ✕
                        </button>
                      } @else {
                        <button class="btn-uber btn-sm" (click)="reactivarProducto(p)" title="Reactivar producto">
                          Reactivar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal Crear / Editar -->
      @if (mostrarModal()) {
        <div class="modal-backdrop">
          <div class="card-uber modal-card">
            <div class="modal-header">
              <h2 class="modal-title">{{ productoEnEdicion() ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
              <button class="btn-close" (click)="cerrarModal()">✕</button>
            </div>

            <p class="modal-hint">Guarda el nombre y el precio para reutilizarlo en las ventas.</p>

            <form (ngSubmit)="guardarProducto()">
              <div class="form-group">
                <label class="form-label" for="nombre">Nombre del producto</label>
                <input
                  id="nombre"
                  type="text"
                  class="form-control"
                  [(ngModel)]="formNombre"
                  name="formNombre"
                  placeholder="Ej. Gaseosa 2L, Azúcar 2lb"
                  required
                  autofocus
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="precio">Precio Unitario (Q)</label>
                <input
                  id="precio"
                  type="number"
                  step="0.50"
                  min="0"
                  class="form-control font-mono"
                  [(ngModel)]="formPrecio"
                  name="formPrecio"
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-uber btn-uber-outline" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn-uber" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando...' : (productoEnEdicion() ? 'Actualizar' : 'Guardar Producto') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section { margin-bottom: 24px; }
    .filters-card {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
    }
    .search-box { flex: 1; min-width: 260px; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }
    .row-inactivo { opacity: 0.6; }
    .action-buttons {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: flex-end;
    }
    .empty-card { text-align: center; padding: 40px; }
    .mt-12 { margin-top: 12px; }
    .loading-state { padding: 48px; text-align: center; color: var(--color-gray-secondary); }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 16px;
    }
    .modal-card { width: 100%; max-width: 440px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .modal-title { font-size: 20px; }
    .btn-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-gray-dark); }
    .modal-hint { font-size: 13px; margin-bottom: 20px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
  `]
})
export class ProductosComponent implements OnInit {
  private productoService = inject(ProductoService);

  productos = signal<Producto[]>([]);
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  errorMensaje = signal<string | null>(null);

  terminoBusqueda = '';
  incluirInactivos = false;

  mostrarModal = signal<boolean>(false);
  productoEnEdicion = signal<Producto | null>(null);
  formNombre = '';
  formPrecio = 0;

  private temporizadorExito?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.productoService.listar(this.terminoBusqueda, this.incluirInactivos).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.productos.set(res.data || []);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al cargar productos');
      }
    });
  }

  onBuscar(): void {
    this.cargarProductos();
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    if (this.temporizadorExito) clearTimeout(this.temporizadorExito);
    this.temporizadorExito = setTimeout(() => this.mensajeExito.set(null), 3000);
  }

  abrirModalCrear(): void {
    this.productoEnEdicion.set(null);
    this.formNombre = '';
    this.formPrecio = 0;
    this.mostrarModal.set(true);
  }

  abrirModalEditar(producto: Producto): void {
    this.productoEnEdicion.set(producto);
    this.formNombre = producto.nombre;
    this.formPrecio = producto.precio_unitario;
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.productoEnEdicion.set(null);
  }

  guardarProducto(): void {
    if (!this.formNombre.trim()) {
      this.errorMensaje.set('El nombre del producto es obligatorio');
      return;
    }
    if (Number(this.formPrecio) < 0) {
      this.errorMensaje.set('El precio no puede ser negativo');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const dto = {
      nombre: this.formNombre.trim(),
      precio_unitario: Number(this.formPrecio) || 0
    };

    const edicion = this.productoEnEdicion();
    const peticion = edicion
      ? this.productoService.actualizar(edicion.id, dto)
      : this.productoService.crear(dto);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.mostrarExito(edicion ? 'Producto actualizado exitosamente' : 'Producto registrado exitosamente');
        this.cargarProductos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorMensaje.set(err.error?.message || 'Error al guardar producto');
      }
    });
  }

  desactivarProducto(producto: Producto): void {
    const confirmacion = confirm(`¿Desactivar el producto "${producto.nombre}"?`);
    if (!confirmacion) return;

    this.productoService.desactivar(producto.id).subscribe({
      next: () => {
        this.mostrarExito('Producto desactivado.');
        this.cargarProductos();
      },
      error: (err) => {
        this.errorMensaje.set(err.error?.message || 'Error al desactivar producto');
      }
    });
  }

  reactivarProducto(producto: Producto): void {
    this.productoService.reactivar(producto.id).subscribe({
      next: () => {
        this.mostrarExito('Producto reactivado exitosamente.');
        this.cargarProductos();
      },
      error: (err) => {
        this.errorMensaje.set(err.error?.message || 'Error al reactivar producto');
      }
    });
  }
}
