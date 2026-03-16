const CACHE_NAME = 'rcui-builder-v1';
const BASE = '/';

// Core shell assets to cache on install
const SHELL_ASSETS = [
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'favicon.png',
];

// Asset patterns that should be cached on first fetch
const CACHEABLE_PATTERNS = [
    /\.js$/,
    /\.css$/,
    /\.woff2?$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.svg$/,
    /\.ico$/,
    /\/backgrounds\//,
    /\/cursors\//,
    /\/sounds\//,
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
];

// Never cache these
const NEVER_CACHE = [
    /supabase/,
    /\/api\//,
    /stripe/,
    /cloudflare/,
    /chrome-extension/,
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(SHELL_ASSETS).catch((err) => {
                console.warn('[SW] Failed to cache some shell assets:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and never-cache patterns
    if (request.method !== 'GET') return;
    if (NEVER_CACHE.some((p) => p.test(request.url))) return;

    // Navigation requests: network-first, fall back to cached shell
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(BASE + 'index.html'))
        );
        return;
    }

    // Cacheable static assets: stale-while-revalidate
    if (CACHEABLE_PATTERNS.some((p) => p.test(request.url))) {
        event.respondWith(
            caches.match(request).then((cached) => {
                const networkFetch = fetch(request)
                    .then((response) => {
                        if (response && response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || networkFetch;
            })
        );
        return;
    }
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
    }
});
