// Service worker simple: guarda en caché lo que se va pidiendo para poder
// abrir la app sin conexión. Primero intenta la red para tener siempre la
// última versión, y si no hay conexión usa la copia guardada.
const CACHE = 'juntada-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copia));
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('./index.html'))),
  );
});
