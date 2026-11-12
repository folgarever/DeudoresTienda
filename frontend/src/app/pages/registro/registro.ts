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
      <div class="auth-card">
        <div class="auth-brand">
          <span class="brand-mark">D</span>
        </div>

        <div class="auth-header">
          <h1 class="auth-title">Crea tu cuenta</h1>
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
                autocomplete="given-name"
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
                autocomplete="family-name"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Correo electrónico</label>
            <div class="input-wrap">
              <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
              <input
                id="email"
                type="email"
                class="form-control has-icon"
                [(ngModel)]="email"
                name="email"
                placeholder="tu_correo@tienda.com"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Nombre de usuario</label>
            <div class="input-wrap">
              <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>
              <input
                id="username"
                type="text"
                class="form-control has-icon"
                [(ngModel)]="username"
                name="username"
                placeholder="usuario_tienda"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña (mínimo 6 caracteres)</label>
            <div class="input-wrap">
              <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="password"
                type="password"
                class="form-control has-icon"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />
            </div>
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
      min-height: calc(100vh - 66px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      background:
        radial-gradient(1100px 460px at 50% -8%, #FFFFFF 0%, rgba(255,255,255,0) 62%),
        var(--color-bg);
    }
    .auth-card {
      width: 100%;
      max-width: 500px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-gray-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 36px;
      animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .auth-brand {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 13px;
      background-color: var(--color-black);
      color: var(--color-white);
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.04em;
    }
    .auth-header {
      margin-bottom: 26px;
      text-align: center;
    }
    .auth-title {
      font-size: 25px;
      margin-bottom: 6px;
    }
    .auth-subtitle {
      font-size: 14px;
    }
    .input-wrap {
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
      padding: 13px;
      font-size: 15px;
    }
    .auth-footer {
      margin-top: 26px;
      padding-top: 18px;
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
      .auth-card {
        padding: 26px 20px;
      }
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
