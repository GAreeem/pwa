const STATIC_CACHE = 'app-shell-v3';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/pages/calendar.html',
  '/pages/form.html',
  '/pages/about.html',
  '/style.css',
  '/register.js'
];

const DYNAMIC_ASSET_URLS = [
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/main.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Importante: solo GET. No interfieras con submits, etc.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1) APP SHELL: ignora querystring para evitar el error con /form.html?
  if (APP_SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(url.pathname, { ignoreSearch: true }).then((cached) => {
        // Si no está en cache por algún motivo, ve a red.
        return cached || fetch(request);
      })
    );
    return;
  }

  // 2) CDN / dinámicos: cache first, luego red, y siempre devolver Response
  if (DYNAMIC_ASSET_URLS.some((u) => request.url.startsWith(u))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, res.clone());
              return res;
            });
          })
          .catch(() => {
            // Último recurso: intenta por path sin search (algunos CDNs no aplican)
            return caches.match(url.pathname, { ignoreSearch: true });
          });
      })
    );
    return;
  }

  // 3) Navegaciones: útil para offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 4) Otros GET: network first con fallback a cache (opcional)
  event.respondWith(
    fetch(request)
      .then((res) => {
        // (Opcional) Puedes cachear aquí también si quieres:
        // const resClone = res.clone();
        // caches.open(DYNAMIC_CACHE).then((c) => c.put(request, resClone));
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
