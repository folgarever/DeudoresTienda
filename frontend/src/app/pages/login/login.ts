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
      <aside class="auth-aside">
        <div class="auth-aside-inner">
          <div class="auth-logo-tile">
            <img src="logo.png" alt="DeudoresTienda">
          </div>
          <h2 class="auth-aside-title">DeudoresTienda</h2>
          <p class="auth-aside-text">Control de clientes, ventas y deudas en un solo lugar.</p>
          <ul class="auth-features">
            <li>
              <span class="feat-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              Registra compras y abonos al instante
            </li>
            <li>
              <span class="feat-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              Controla la deuda de cada cliente
            </li>
            <li>
              <span class="feat-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
              Cierre de caja y reportes en PDF
            </li>
          </ul>
        </div>
      </aside>

      <main class="auth-main">
        <div class="auth-card">
          <div class="auth-brand">
            <img class="auth-logo" src="logo.png" alt="DeudoresTienda">
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
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .auth-wrapper {
      display: flex;
      width: 100%;
      min-height: calc(100vh - 66px);
      min-height: calc(100dvh - 66px);
    }

    /* Panel de marca (solo escritorio/tablet ancha) */
    .auth-aside {
      flex: 1 1 46%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(28px, 4vw, 56px);
      color: #FFFFFF;
      background:
        radial-gradient(700px 520px at 18% 8%, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0) 62%),
        #0B0B0D;
      overflow: hidden;
    }
    .auth-aside-inner {
      width: 100%;
      max-width: 420px;
      animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .auth-logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: clamp(72px, 8vw, 88px);
      height: clamp(72px, 8vw, 88px);
      padding: 12px;
      border-radius: 22px;
      background-color: #FFFFFF;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
      margin-bottom: 26px;
    }
    .auth-logo-tile img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      object-fit: cover;
    }
    .auth-aside-title {
      color: #FFFFFF;
      font-size: clamp(24px, 2.4vw, 30px);
      letter-spacing: -0.03em;
      margin-bottom: 10px;
    }
    .auth-aside-text {
      color: rgba(255, 255, 255, 0.68);
      font-size: 15px;
      margin-bottom: 28px;
    }
    .auth-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .auth-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 14.5px;
    }
    .feat-ico {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex: none;
      border-radius: 999px;
      background-color: rgba(255, 255, 255, 0.10);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #FFFFFF;
    }
    .feat-ico svg {
      width: 13px;
      height: 13px;
    }

    /* Panel del formulario */
    .auth-main {
      flex: 1 1 54%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(24px, 4vw, 56px) clamp(16px, 3vw, 48px);
      background:
        radial-gradient(1100px 460px at 50% -8%, var(--color-surface) 0%, rgba(255, 255, 255, 0) 62%),
        var(--color-bg);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      background-color: var(--color-surface);
      border: 1px solid var(--color-gray-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: clamp(24px, 4vw, 36px);
      animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Logo dentro de la tarjeta: visible solo cuando se oculta el panel lateral */
    .auth-brand {
      display: none;
      justify-content: center;
      margin-bottom: 20px;
    }
    .auth-logo {
      width: clamp(64px, 16vw, 76px);
      height: clamp(64px, 16vw, 76px);
      border-radius: 18px;
      object-fit: cover;
      border: 1px solid var(--color-gray-border);
      box-shadow: var(--shadow-sm);
    }

    .auth-header {
      margin-bottom: 26px;
      text-align: center;
    }
    .auth-title {
      font-size: clamp(22px, 3vw, 25px);
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

    /* Adaptabilidad: en pantallas angostas se oculta el panel lateral */
    @media (max-width: 900px) {
      .auth-aside {
        display: none;
      }
      .auth-brand {
        display: flex;
      }
    }
    @media (max-width: 480px) {
      .auth-card {
        padding: 24px 18px;
      }
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
