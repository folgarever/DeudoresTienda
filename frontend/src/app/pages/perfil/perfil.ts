import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-app">
      <div class="header-section">
        <a routerLink="/dashboard" class="back-link">← Volver al panel</a>
        <h1 class="page-title mt-8">Mi Perfil</h1>
        <p class="text-muted">Actualiza tus datos personales y la contraseña de acceso.</p>
      </div>

      @if (mensajeExito()) {
        <div class="alert-uber">{{ mensajeExito() }}</div>
      }
      @if (errorMensaje()) {
        <div class="alert-uber alert-uber-error">{{ errorMensaje() }}</div>
      }

      <div class="profile-grid">
        <!-- Datos personales -->
        <div class="card-uber profile-card">
          <h2 class="card-title">Datos personales</h2>
          <p class="card-subtitle">Tu usuario y correo no se pueden modificar.</p>

          <form (ngSubmit)="guardarPerfil()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label" for="nombres">Nombres</label>
                <input
                  id="nombres"
                  type="text"
                  class="form-control"
                  [(ngModel)]="nombres"
                  name="nombres"
                  placeholder="Ej. Ana María"
                  required
                />
              </div>
              <div class="form-group flex-1">
                <label class="form-label" for="apellidos">Apellidos</label>
                <input
                  id="apellidos"
                  type="text"
                  class="form-control"
                  [(ngModel)]="apellidos"
                  name="apellidos"
                  placeholder="Ej. Gómez Pérez"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Correo electrónico</label>
              <input type="text" class="form-control" [value]="email" disabled />
            </div>

            <div class="form-group">
              <label class="form-label">Nombre de usuario</label>
              <input type="text" class="form-control" [value]="username" disabled />
            </div>

            <button type="submit" class="btn-uber" [disabled]="guardandoPerfil()">
              {{ guardandoPerfil() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>

        <!-- Cambio de contraseña -->
        <div class="card-uber profile-card">
          <h2 class="card-title">Cambiar contraseña</h2>
          <p class="card-subtitle">Usa una contraseña de al menos 8 caracteres.</p>

          <form (ngSubmit)="cambiarPassword()">
            <div class="form-group">
              <label class="form-label" for="actual">Contraseña actual</label>
              <input
                id="actual"
                type="password"
                class="form-control"
                [(ngModel)]="passwordActual"
                name="passwordActual"
                placeholder="••••••••"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="nueva">Nueva contraseña</label>
              <input
                id="nueva"
                type="password"
                class="form-control"
                [(ngModel)]="passwordNueva"
                name="passwordNueva"
                placeholder="••••••••"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmar">Confirmar nueva contraseña</label>
              <input
                id="confirmar"
                type="password"
                class="form-control"
                [(ngModel)]="passwordConfirmar"
                name="passwordConfirmar"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" class="btn-uber btn-uber-secondary" [disabled]="guardandoPassword()">
              {{ guardandoPassword() ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-section { margin-bottom: 24px; }
    .back-link { font-size: 13px; text-decoration: underline; color: var(--color-gray-dark); }
    .mt-8 { margin-top: 8px; }
    .page-title { font-size: 28px; margin-bottom: 4px; }
    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .profile-card { padding: 24px; }
    .card-title { font-size: 18px; margin-bottom: 4px; }
    .card-subtitle { font-size: 13px; color: var(--color-gray-secondary); margin-bottom: 20px; }
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .form-control:disabled {
      background-color: var(--color-gray-light);
      color: var(--color-gray-secondary);
      cursor: not-allowed;
    }
    @media (max-width: 860px) {
      .profile-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; gap: 0; }
    }
  `]
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);

  nombres = '';
  apellidos = '';
  email = '';
  username = '';

  passwordActual = '';
  passwordNueva = '';
  passwordConfirmar = '';

  guardandoPerfil = signal<boolean>(false);
  guardandoPassword = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);
  errorMensaje = signal<string | null>(null);
  private temporizadorExito?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const usuario = this.authService.currentUser();
    if (usuario) {
      this.cargarDatos(usuario);
    }

    this.authService.obtenerPerfil().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.cargarDatos(res.data);
        }
      },
      error: () => {
        // Si falla la consulta se conservan los datos locales de la sesión.
      }
    });
  }

  private cargarDatos(usuario: { nombres: string; apellidos: string; email: string; username: string }): void {
    this.nombres = usuario.nombres;
    this.apellidos = usuario.apellidos;
    this.email = usuario.email;
    this.username = usuario.username;
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    this.errorMensaje.set(null);
    if (this.temporizadorExito) {
      clearTimeout(this.temporizadorExito);
    }
    this.temporizadorExito = setTimeout(() => this.mensajeExito.set(null), 4000);
  }

  guardarPerfil(): void {
    if (!this.nombres.trim() || !this.apellidos.trim()) {
      this.errorMensaje.set('El nombre y el apellido son obligatorios');
      this.mensajeExito.set(null);
      return;
    }

    this.guardandoPerfil.set(true);
    this.errorMensaje.set(null);

    this.authService.actualizarPerfil({
      nombres: this.nombres.trim(),
      apellidos: this.apellidos.trim()
    }).subscribe({
      next: () => {
        this.guardandoPerfil.set(false);
        this.mostrarExito('Perfil actualizado exitosamente');
      },
      error: (err) => {
        this.guardandoPerfil.set(false);
        this.mensajeExito.set(null);
        this.errorMensaje.set(err.error?.message || 'Error al actualizar el perfil');
      }
    });
  }

  cambiarPassword(): void {
    if (!this.passwordActual || !this.passwordNueva || !this.passwordConfirmar) {
      this.errorMensaje.set('Debe completar todos los campos de contraseña');
      this.mensajeExito.set(null);
      return;
    }

    if (this.passwordNueva.length < 8) {
      this.errorMensaje.set('La nueva contraseña debe tener al menos 8 caracteres');
      this.mensajeExito.set(null);
      return;
    }

    if (this.passwordNueva !== this.passwordConfirmar) {
      this.errorMensaje.set('La nueva contraseña y su confirmación no coinciden');
      this.mensajeExito.set(null);
      return;
    }

    this.guardandoPassword.set(true);
    this.errorMensaje.set(null);

    this.authService.cambiarPassword({
      passwordActual: this.passwordActual,
      passwordNueva: this.passwordNueva
    }).subscribe({
      next: () => {
        this.guardandoPassword.set(false);
        this.passwordActual = '';
        this.passwordNueva = '';
        this.passwordConfirmar = '';
        this.mostrarExito('Contraseña actualizada exitosamente');
      },
      error: (err) => {
        this.guardandoPassword.set(false);
        this.mensajeExito.set(null);
        this.errorMensaje.set(err.error?.message || 'Error al actualizar la contraseña');
      }
    });
  }
}
