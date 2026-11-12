import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="card-uber auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Crear cuenta</h1>
          <p class="auth-subtitle">Registra tu tienda para administrar clientes y deudas</p>
        </div>

        @if (errorMensaje()) {
          <div class="alert-uber alert-uber-error">
            {{ errorMensaje() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
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
            <label class="form-label" for="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              placeholder="tu_correo@tienda.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Nombre de usuario</label>
            <input
              id="username"
              type="text"
              class="form-control"
              [(ngModel)]="username"
              name="username"
              placeholder="usuario_tienda"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña (mínimo 6 caracteres)</label>
            <input
              id="password"
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-uber btn-block"
            [disabled]="cargando()"
          >
            {{ cargando() ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/login" class="auth-link">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background-color: var(--color-gray-light);
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      background-color: var(--color-white);
      border-radius: var(--radius-uber);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 32px;
    }
    .auth-header {
      margin-bottom: 24px;
    }
    .auth-title {
      font-size: 24px;
      margin-bottom: 6px;
    }
    .auth-subtitle {
      font-size: 14px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 {
      flex: 1;
    }
    .btn-block {
      width: 100%;
      margin-top: 8px;
      padding: 12px;
      font-size: 15px;
    }
    .auth-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-border);
      text-align: center;
      font-size: 14px;
    }
    .auth-link {
      color: var(--color-black);
      font-weight: 600;
      text-decoration: underline;
    }
    @media (max-width: 480px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class RegistroComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombres = '';
  apellidos = '';
  email = '';
  username = '';
  password = '';
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  onSubmit(): void {
    if (!this.nombres.trim() || !this.apellidos.trim() || !this.email.trim() || !this.username.trim() || !this.password) {
      this.errorMensaje.set('Todos los campos son obligatorios.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMensaje.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.register({
      nombres: this.nombres.trim(),
      apellidos: this.apellidos.trim(),
      email: this.email.trim().toLowerCase(),
      username: this.username.trim().toLowerCase(),
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error al registrar la cuenta. Verifica que el correo o usuario no estén ya registrados.';
        this.errorMensaje.set(msg);
      }
    });
  }
}
