import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Pie de pagina con la informacion legal y el medio de contacto.
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img class="footer-logo" src="logo.png" alt="DeudoresTienda" width="26" height="26">
          <div>
            <span class="footer-name">DeudoresTienda</span>
            <span class="footer-tag">Control de clientes, ventas y deudas</span>
          </div>
        </div>

        <nav class="footer-links" aria-label="Enlaces legales">
          <a routerLink="/privacidad">Política de Privacidad</a>
          <a routerLink="/terminos">Términos y Condiciones</a>
          <a href="mailto:folgarever19@gmail.com">folgarever19&#64;gmail.com</a>
        </nav>
      </div>

      <p class="footer-copy">
        © {{ anio }} DeudoresTienda. Todos los derechos reservados.
      </p>
    </footer>
  `,
  styles: [`
    .app-footer {
      margin-top: 40px;
      border-top: 1px solid var(--color-gray-border);
      background-color: var(--color-surface);
      padding: 24px clamp(16px, 2.2vw, 44px) 28px;
    }
    .footer-inner {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 18px;
      max-width: 100%;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .footer-logo {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      object-fit: cover;
      border: 1px solid var(--color-gray-border);
      background-color: #FFFFFF;
      flex: none;
    }
    .footer-name {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: var(--color-black);
      letter-spacing: -0.02em;
    }
    .footer-tag {
      display: block;
      font-size: 12px;
      color: var(--color-gray-secondary);
    }
    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 22px;
      font-size: 13px;
    }
    .footer-links a {
      color: var(--color-gray-secondary);
      transition: color 0.15s ease;
    }
    .footer-links a:hover {
      color: var(--color-black);
      text-decoration: underline;
    }
    .footer-copy {
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-border);
      font-size: 12px;
      color: var(--color-gray-secondary);
    }
    @media (max-width: 640px) {
      .footer-inner { flex-direction: column; }
    }
  `]
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
}
