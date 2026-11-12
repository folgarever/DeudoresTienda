import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="brand-mark">D</span>
        </div>

        <div class="auth-header">
          <h1 class="auth-title">Bienvenido de nuevo</h1>
          <p class="auth-subtitle">Ingresa tus credenciales para administrar la tienda</p>
        </div>

        @if (errorMensaje()) {
          <div class="alert-uber alert-uber-error">
            {{ errorMensaje() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="usernameOrEmail">Usuario o correo</label>
            <div class="input-wrap">
              <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input
                id="usernameOrEmail"
                type="text"
                class="form-control has-icon"
                [(ngModel)]="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="ejemplo@correo.com o tu_usuario"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
            <div class="input-wrap">
              <svg class="input-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                id="password"
                type="password"
                class="form-control has-icon"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            class="btn-uber btn-block"
            [disabled]="cargando()"
          >
            {{ cargando() ? 'Iniciando sesión...' : 'Ingresar al sistema' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a routerLink="/registro" class="auth-link">Regístrate aquí</a></p>
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
      max-width: 440px;
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
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  usernameOrEmail = '';
  password = '';
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  onSubmit(): void {
    if (!this.usernameOrEmail.trim() || !this.password) {
      this.errorMensaje.set('Por favor completa todos los campos.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    this.authService.login({
      usernameOrEmail: this.usernameOrEmail.trim(),
      password: this.password
    }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.message || 'Error al iniciar sesión. Revisa tus credenciales.';
        this.errorMensaje.set(msg);
      }
    });
  }
}
