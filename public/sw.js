const CACHE_NAME = 'rcui-builder-shell-v2';
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/branding/og-banner.svg',
  '/backgrounds/main-view.svg'
];

const NEVER_CACHE = [/\/api\//, /supabase/i, /stripe/i, /cloudflare/i];
const STATIC_ASSET = /\.(?:js|css|svg|png|jpg|jpeg|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (NEVER_CACHE.some((pattern) => pattern.test(request.url))) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  if (STATIC_ASSET.test(request.url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);

        return cached || network;
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
