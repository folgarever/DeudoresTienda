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
      <div class="card-uber auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Iniciar sesión</h1>
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
            <input
              id="usernameOrEmail"
              type="text"
              class="form-control"
              [(ngModel)]="usernameOrEmail"
              name="usernameOrEmail"
              placeholder="ejemplo@correo.com o tu_usuario"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Contraseña</label>
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
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background-color: var(--color-gray-light);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
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
