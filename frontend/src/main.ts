import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

// Registra el Service Worker (PWA) solo en produccion y si el navegador lo soporta.
if (environment.production && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .catch((err) => console.warn('No se pudo registrar el Service Worker:', err));
  });
}
