import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';
import { PwaService } from '../../core/pwa.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  pwaService = inject(PwaService);
  menuOpen = false;
  mostrarInstrucciones = false;

  initials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    const primera = user.nombres?.trim().charAt(0) || '';
    const segunda = user.apellidos?.trim().charAt(0) || '';
    const resultado = `${primera}${segunda}`.toUpperCase();
    return resultado || user.username?.charAt(0).toUpperCase() || '?';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleTema(): void {
    this.themeService.toggle();
  }

  // Instala la app: abre el dialogo del navegador o muestra las instrucciones
  // de iOS cuando el prompt nativo no esta disponible.
  async instalarApp(): Promise<void> {
    const modo = await this.pwaService.instalar();
    if (modo === 'ios') {
      this.mostrarInstrucciones = true;
    }
    this.closeMenu();
  }

  cerrarInstrucciones(): void {
    this.mostrarInstrucciones = false;
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
