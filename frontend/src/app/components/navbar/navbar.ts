import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';

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
  menuOpen = false;

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

  logout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
