import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente, OrdenClientes } from '../../models';
import { descargarPDF } from '../../core/exportar.utils';
import { fechaCorta } from '../../core/fecha.utils';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-app">
      <!-- Encabezado -->
      <div class="flex-between header-section">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="text-muted">Directorio de clientes y saldos pendientes</p>
        </div>
        <div class="header-actions">
          <button class="btn-uber btn-uber-outline" (click)="exportarClientes()">
            Exportar PDF
          </button>
          <button class="btn-uber" (click)="abrirModalCrear()">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="card-uber filters-card">
        <div class="search-box input-wrap">
          <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            class="form-control has-icon"
            placeholder="Buscar cliente por nombre o apellido..."
            [(ngModel)]="terminoBusqueda"
            (input)="onBuscar()"
          />
        </div>
        <div class="filter-options">
          <label class="checkbox-label">
            <input
              type="checkbox"
              [(ngModel)]="soloConDeuda"
              (change)="onBuscar()"
            />
            Solo clientes con deuda pendiente
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              [(ngModel)]="incluirInactivos"
              (change)="onBuscar()"
            />
            Mostrar clientes inactivos
          </label>
        </div>
        <div class="orden-box">
          <label class="form-label" for="orden">Ordenar por</label>
          <select id="orden" class="form-control" [(ngModel)]="orden" (change)="onBuscar()">
            <option value="nombre">Nombre (A–Z)</option>
            <option value="saldo">Mayor deuda</option>
            <option value="reciente">Más recientes</option>
          </select>
        </div>
      </div>

      <!-- Estado de carga y mensajes -->
      @if (mensajeExito()) {
        <div class="alert-uber">
          {{ mensajeExito() }}
        </div>
      }
      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">
          {{ errorMensaje() }}
        </div>
      }

      @if (cargando()) {
        <div class="loading-state">
          <p>Cargando lista de clientes...</p>
        </div>
      } @else if (clientes().length === 0) {
        <div class="card-uber empty-card">
          <p>No se encontraron clientes con los filtros aplicados.</p>
          <button class="btn-uber btn-sm mt-12" (click)="abrirModalCrear()">
            Registrar primer cliente
          </button>
        </div>
      } @else {
        <!-- Tabla de Clientes -->
        <div class="table-container">
          <table class="table-uber">
            <thead>
              <tr>
                <th>Nombre del Cliente</th>
                <th>Estado</th>
                <th>Último abono</th>
                <th class="text-right">Días sin abonar</th>
                <th class="text-right">Saldo Pendiente</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientes(); track c.id) {
                <tr [class.row-inactivo]="!c.activo">
                  <td class="font-bold">
                    <a [routerLink]="['/clientes', c.id, 'historial']" class="client-link">
                      {{ c.nombre }} {{ c.apellido }}
                    </a>
                    @if (c.notas) {
                      <span class="nota-indicador" [title]="c.notas" aria-label="Este cliente tiene notas">📝</span>
                    }
                  </td>
                  <td>
                    @if (!c.activo) {
                      <span class="badge-uber badge-inactivo">Inactivo</span>
                    } @else if (c.saldo_pendiente > 0) {
                      <span class="badge-uber badge-deuda">Debe Q{{ c.saldo_pendiente | number:'1.2-2' }}</span>
                    } @else {
                      <span class="badge-uber badge-saldado">Al día (Q0.00)</span>
                    }
                  </td>
                  <td class="text-muted font-mono ultimo-abono-cell">
                    {{ c.ultimo_abono ? (c.ultimo_abono | date:'dd/MM/yyyy') : 'Sin abonos' }}
                  </td>
                  <td class="text-right font-mono" [class.dias-alerta]="(c.dias_sin_abonar ?? 0) >= 30">
                    {{ c.dias_sin_abonar === null || c.dias_sin_abonar === undefined ? '—' : c.dias_sin_abonar }}
                  </td>
                  <td class="text-right font-mono font-bold" [class.debt-color]="c.saldo_pendiente > 0">
                    Q{{ c.saldo_pendiente | number:'1.2-2' }}
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      @if (c.activo) {
                        @if (c.saldo_pendiente > 0) {
                          <a [routerLink]="['/abonos/nuevo']" [queryParams]="{ clienteId: c.id }" class="btn-uber btn-sm">
                            Abonar
                          </a>
                        }
                        <a [routerLink]="['/ventas/nueva']" [queryParams]="{ clienteId: c.id }" class="btn-uber btn-sm btn-uber-secondary">
                          + Venta
                        </a>
                      }
                      <a [routerLink]="['/clientes', c.id, 'historial']" class="btn-uber btn-sm btn-uber-outline">
                        Historial
                      </a>
                      <button class="btn-uber btn-sm btn-uber-secondary" (click)="abrirModalEditar(c)">
                        Editar
                      </button>
                      @if (c.activo) {
                        <button class="btn-uber btn-sm btn-uber-danger" (click)="desactivarCliente(c)" title="Desactivar cliente">
                          ✕
                        </button>
                      } @else {
                        <button class="btn-uber btn-sm" (click)="reactivarCliente(c)" title="Reactivar cliente">
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

        <!-- Controles de Paginación -->
        <div class="pagination-bar">
          <span class="text-muted pagination-info">
            Mostrando {{ rangoInicio() }}–{{ rangoFin() }} de {{ total() }} cliente(s)
          </span>
          <div class="pagination-controls">
            <button class="btn-uber btn-sm btn-uber-secondary" [disabled]="pagina() <= 1" (click)="irPagina(pagina() - 1)">
              ← Anterior
            </button>
            <span class="page-indicator">Página {{ pagina() }} de {{ totalPaginas() }}</span>
            <button class="btn-uber btn-sm btn-uber-secondary" [disabled]="pagina() >= totalPaginas()" (click)="irPagina(pagina() + 1)">
              Siguiente →
            </button>
          </div>
        </div>
      }

      <!-- Modal para Crear / Editar Cliente -->
      @if (mostrarModal()) {
        <div class="modal-backdrop">
          <div class="card-uber modal-card">
            <div class="modal-header">
              <h2 class="modal-title">
                {{ clienteEnEdicion() ? 'Editar Cliente' : 'Nuevo Cliente' }}
              </h2>
              <button class="btn-close" (click)="cerrarModal()">✕</button>
            </div>

            <p class="modal-hint">
              Únicamente se requiere el nombre y apellido para el control de deudas.
            </p>

            <form (ngSubmit)="guardarCliente()">
              <div class="form-group">
                <label class="form-label" for="nombre">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  class="form-control"
                  [(ngModel)]="formNombre"
                  name="formNombre"
                  placeholder="Ej. Juan Carlos"
                  required
                  autofocus
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="apellido">Apellido</label>
                <input
                  id="apellido"
                  type="text"
                  class="form-control"
                  [(ngModel)]="formApellido"
                  name="formApellido"
                  placeholder="Ej. Pérez Morales"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="notas">Notas (Opcional)</label>
                <textarea
                  id="notas"
                  class="form-control"
                  rows="3"
                  maxlength="500"
                  [(ngModel)]="formNotas"
                  name="formNotas"
                  placeholder="Ej. Paga los viernes, trabaja en..., referencia, etc."
                ></textarea>
                <span class="field-hint text-muted">
                  Recordatorios o referencias del cliente. Se muestran en su ficha (historial).
                </span>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-uber btn-uber-outline" (click)="cerrarModal()">
                  Cancelar
                </button>
                <button type="submit" class="btn-uber" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando...' : (clienteEnEdicion() ? 'Actualizar' : 'Guardar Cliente') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-section {
      margin-bottom: 24px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }
    .pagination-info {
      font-size: 13px;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-indicator {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }
    .page-title {
      font-size: 28px;
    }
    .filters-card {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }
    .input-ico {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 17px;
      height: 17px;
      color: var(--color-gray-soft);
      pointer-events: none;
    }
    .form-control.has-icon {
      padding-left: 42px;
    }
    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
      user-select: none;
    }
    .orden-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;
    }
    .ultimo-abono-cell {
      font-size: 13px;
    }
    .dias-alerta {
      color: var(--color-danger);
      font-weight: 700;
    }
    .client-link {
      text-decoration: underline;
    }
    .nota-indicador {
      margin-left: 6px;
      font-size: 13px;
      cursor: help;
    }
    .field-hint {
      display: block;
      font-size: 12px;
      margin-top: 4px;
      line-height: 1.4;
    }
    .debt-color {
      color: var(--color-black);
    }
    .row-inactivo {
      opacity: 0.6;
    }
    .action-buttons {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: flex-end;
    }
    .empty-card {
      text-align: center;
      padding: 40px;
    }
    .mt-12 {
      margin-top: 12px;
    }
    .loading-state {
      padding: 48px;
      text-align: center;
      color: var(--color-gray-secondary);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 16px;
    }
    .modal-card {
      width: 100%;
      max-width: 440px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .modal-title {
      font-size: 20px;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--color-gray-dark);
    }
    .modal-hint {
      font-size: 13px;
      margin-bottom: 20px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `]
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private route = inject(ActivatedRoute);

  clientes = signal<Cliente[]>([]);
  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  errorMensaje = signal<string | null>(null);

  terminoBusqueda = '';
  soloConDeuda = false;
  incluirInactivos = false;
  orden: OrdenClientes = 'nombre';

  pagina = signal(1);
  limite = signal(20);
  total = signal(0);
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limite())));
  rangoInicio = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.limite() + 1));
  rangoFin = computed(() => Math.min(this.pagina() * this.limite(), this.total()));

  mostrarModal = signal<boolean>(false);
  clienteEnEdicion = signal<Cliente | null>(null);
  formNombre = '';
  formApellido = '';
  formNotas = '';
  private temporizadorExito?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['soloConDeuda'] === 'true') {
        this.soloConDeuda = true;
      }
      if (params['incluirInactivos'] === 'true') {
        this.incluirInactivos = true;
      }
      this.cargarClientes();
    });
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.clienteService
      .listar(this.terminoBusqueda, this.soloConDeuda, this.incluirInactivos, this.pagina(), this.limite(), this.orden)
      .subscribe({
        next: (res) => {
          this.cargando.set(false);
          this.clientes.set(res.data || []);
          this.total.set(res.total ?? (res.data || []).length);
        },
        error: (err) => {
          this.cargando.set(false);
          this.errorMensaje.set(err.error?.message || 'Error al cargar clientes');
        }
      });
  }

  onBuscar(): void {
    this.pagina.set(1);
    this.cargarClientes();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargarClientes();
  }

  exportarClientes(): void {
    // Exporta todos los clientes que cumplen los filtros actuales, sin paginar.
    this.clienteService
      .listar(this.terminoBusqueda, this.soloConDeuda, this.incluirInactivos, 1, 500, this.orden)
      .subscribe({
        next: (res) => {
          const lista = res.data || [];
          if (lista.length === 0) {
            this.errorMensaje.set('No hay clientes para exportar con los filtros actuales.');
            return;
          }

          const filas = lista.map((c) => [
            `${c.nombre} ${c.apellido}`.trim(),
            c.saldo_pendiente.toFixed(2),
            c.ultimo_abono ? fechaCorta(c.ultimo_abono) : 'Sin abonos',
            c.dias_sin_abonar === null || c.dias_sin_abonar === undefined ? '—' : String(c.dias_sin_abonar),
            c.activo ? (c.saldo_pendiente > 0 ? 'Con deuda' : 'Al dia') : 'Inactivo',
            c.notas || '',
          ]);

          const totalDeuda = lista.reduce((suma, c) => suma + c.saldo_pendiente, 0);

          descargarPDF({
            titulo: 'Directorio de Clientes',
            subtitulo: `${lista.length} cliente(s) · Deuda total: Q${totalDeuda.toFixed(2)}`,
            nombreArchivo: 'clientes',
            encabezados: ['Cliente', 'Saldo (Q)', 'Último abono', 'Días sin abonar', 'Estado', 'Notas'],
            filas,
            alineaciones: { 1: 'right', 3: 'right' },
          });
        },
        error: (err) => {
          this.errorMensaje.set(err.error?.message || 'Error al exportar clientes');
        }
      });
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    if (this.temporizadorExito) {
      clearTimeout(this.temporizadorExito);
    }
    this.temporizadorExito = setTimeout(() => this.mensajeExito.set(null), 3000);
  }

  abrirModalCrear(): void {
    this.clienteEnEdicion.set(null);
    this.formNombre = '';
    this.formApellido = '';
    this.formNotas = '';
    this.mostrarModal.set(true);
  }

  abrirModalEditar(cliente: Cliente): void {
    this.clienteEnEdicion.set(cliente);
    this.formNombre = cliente.nombre;
    this.formApellido = cliente.apellido;
    this.formNotas = cliente.notas || '';
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.clienteEnEdicion.set(null);
  }

  guardarCliente(): void {
    if (!this.formNombre.trim() || !this.formApellido.trim()) {
      this.errorMensaje.set('El nombre y el apellido son obligatorios');
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const dto = {
      nombre: this.formNombre.trim(),
      apellido: this.formApellido.trim(),
      notas: this.formNotas.trim()
    };

    const edicion = this.clienteEnEdicion();

    if (edicion) {
      this.clienteService.actualizar(edicion.id, dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.mostrarExito('Cliente actualizado exitosamente');
          this.cargarClientes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorMensaje.set(err.error?.message || 'Error al actualizar cliente');
        }
      });
    } else {
      this.clienteService.crear(dto).subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.mostrarExito('Cliente registrado exitosamente');
          this.cargarClientes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorMensaje.set(err.error?.message || 'Error al crear cliente');
        }
      });
    }
  }

  desactivarCliente(cliente: Cliente): void {
    const confirmacion = confirm(`¿Estás segura de desactivar a "${cliente.nombre} ${cliente.apellido}"? Su historial y deudas permanecerán guardados.`);
    if (!confirmacion) return;

    this.clienteService.desactivar(cliente.id).subscribe({
      next: () => {
        this.mostrarExito('Cliente desactivado conservando su historial.');
        this.cargarClientes();
      },
      error: (err) => {
        this.errorMensaje.set(err.error?.message || 'Error al desactivar cliente');
      }
    });
  }

  reactivarCliente(cliente: Cliente): void {
    this.clienteService.reactivar(cliente.id).subscribe({
      next: () => {
        this.mostrarExito('Cliente reactivado exitosamente.');
        this.cargarClientes();
      },
      error: (err) => {
        this.errorMensaje.set(err.error?.message || 'Error al reactivar cliente');
      }
    });
  }
}
