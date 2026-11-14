import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

// Pagina mostrada cuando el usuario intenta acceder a una ruta inexistente.
@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-app">
      <div class="not-found">
        <span class="nf-code">404</span>
        <h1 class="nf-title">Página no encontrada</h1>
        <p class="nf-text">
          La dirección a la que intentaste acceder no existe o fue movida.
          Verifica el enlace o regresa al inicio.
        </p>
        <div class="nf-actions">
          @if (authService.isAuthenticated()) {
            <a routerLink="/dashboard" class="btn-uber">Ir al panel</a>
            <a routerLink="/clientes" class="btn-uber btn-uber-secondary">Ver clientes</a>
          } @else {
            <a routerLink="/login" class="btn-uber">Iniciar sesión</a>
            <a routerLink="/" class="btn-uber btn-uber-secondary">Ir al inicio</a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      max-width: 560px;
      margin: clamp(40px, 9vh, 110px) auto;
      text-align: center;
      animation: fade-in-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .nf-code {
      display: inline-block;
      font-size: clamp(64px, 14vw, 104px);
      font-weight: 700;
      letter-spacing: -0.05em;
      line-height: 1;
      color: var(--color-black);
    }
    .nf-title {
      font-size: clamp(22px, 3.4vw, 28px);
      margin: 10px 0 12px;
    }
    .nf-text {
      font-size: 15px;
      color: var(--color-gray-secondary);
      margin-bottom: 28px;
    }
    .nf-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class NoEncontradoComponent {
  authService = inject(AuthService);
}
