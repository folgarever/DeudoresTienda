/* =============================================================================
 * Service Worker — DeudoresTienda (PWA)
 * Estrategia:
 *   - Navegaciones: red primero, con respaldo del index.html en cache (offline).
 *   - Estaticos (mismo origen, GET): cache primero, actualizando en segundo plano.
 *   - API (/api/): nunca se cachea; siempre red.
 * ===========================================================================*/

const CACHE_VERSION = 'deudores-tienda-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/logo-192.png',
  '/logo.png',
  '/logo-maskable.png',
];

// Instala el service worker y precarga el app shell minimo.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

// Activa el service worker y limpia versiones anteriores del cache.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo se manejan peticiones GET del mismo origen.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // La API nunca se cachea: siempre datos frescos.
  if (url.pathname.startsWith('/api/')) return;

  // Navegaciones (documentos): red primero, con respaldo del app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copia = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copia));
          return response;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Estaticos: cache primero, revalidando en segundo plano.
  event.respondWith(
    caches.match(request).then((cached) => {
      const red = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copia = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
          }
          return response;
        })
        .catch(() => cached);
      return cached || red;
    })
  );
});
