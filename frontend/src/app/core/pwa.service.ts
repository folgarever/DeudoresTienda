import { Injectable, computed, signal } from '@angular/core';

// Evento no estandar de Chrome/Edge que permite abrir el dialogo de instalacion.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Servicio que controla la instalacion de la app como PWA.
// Detecta si el navegador ofrece instalar (Android/escritorio), si ya esta
// instalada y si el dispositivo es iOS (donde hay que guiar al usuario).
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // El navegador ofrecio el dialogo de instalacion y aun no se instalo.
  puedeInstalar = signal<boolean>(false);
  // La app ya corre como aplicacion instalada (modo standalone).
  instalada = signal<boolean>(false);
  // Dispositivo iOS/iPadOS: no existe el prompt y se muestran instrucciones.
  esIOS = signal<boolean>(false);

  // Muestra el boton cuando la app se puede instalar todavia.
  mostrarInstalar = computed(
    () => !this.instalada() && (this.puedeInstalar() || this.esIOS())
  );

  constructor() {
    if (typeof window === 'undefined') return;

    this.instalada.set(this.detectarStandalone());
    this.esIOS.set(this.detectarIOS());

    window.addEventListener('beforeinstallprompt', (event) => {
      // Se evita el mini-aviso automatico para controlarlo con el boton propio.
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.puedeInstalar.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.puedeInstalar.set(false);
      this.instalada.set(true);
    });
  }

  // Abre el dialogo nativo de instalacion. Devuelve el modo usado para que la
  // interfaz sepa si debe mostrar las instrucciones de iOS.
  async instalar(): Promise<'prompt' | 'ios' | 'no-disponible'> {
    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const eleccion = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.puedeInstalar.set(false);
      if (eleccion?.outcome === 'accepted') {
        this.instalada.set(true);
      }
      return 'prompt';
    }
    return this.esIOS() ? 'ios' : 'no-disponible';
  }

  // true cuando la app se abre como aplicacion instalada.
  private detectarStandalone(): boolean {
    try {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      );
    } catch {
      return false;
    }
  }

  // Detecta iOS/iPadOS (incluye iPad que se identifica como Mac).
  private detectarIOS(): boolean {
    const ua = window.navigator.userAgent || '';
    const esIPhoneIPadIPod = /iPad|iPhone|iPod/.test(ua);
    const esIPadOS = ua.includes('Macintosh') && 'ontouchend' in document;
    return esIPhoneIPadIPod || esIPadOS;
  }
}
