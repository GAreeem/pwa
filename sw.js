const STATIC_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

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
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(APP_SHELL_ASSETS))
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (APP_SHELL_ASSETS.includes(url.pathname)) {
        event.respondWith(caches.match(request));
        return;
    }

    if (DYNAMIC_ASSET_URLS.some(dynamicUrl => request.url.includes(dynamicUrl))) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(networkResponse => {
                        return caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch(() => caches.match(request));
            })
        );
    }
});