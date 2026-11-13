import { Injectable, signal } from '@angular/core';

export type Tema = 'light' | 'dark';

// Servicio de tema (claro/oscuro). Persiste la preferencia en localStorage y
// aplica la clase `theme-dark` al <body> para que el CSS global reaccione.
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private storageKey = 'deudores_tema';

  tema = signal<Tema>(this.leerGuardado());

  constructor() {
    this.aplicar(this.tema());
  }

  private leerGuardado(): Tema {
    try {
      return localStorage.getItem(this.storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private aplicar(tema: Tema): void {
    const body = document.body;
    if (tema === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.remove('theme-dark');
    }
  }

  toggle(): void {
    const nuevo: Tema = this.tema() === 'dark' ? 'light' : 'dark';
    this.tema.set(nuevo);
    try {
      localStorage.setItem(this.storageKey, nuevo);
    } catch {
      // Sin acceso a localStorage se conserva el tema solo en memoria.
    }
    this.aplicar(nuevo);
  }
}
