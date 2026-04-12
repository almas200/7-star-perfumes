const CACHE_NAME = 'ssp-cache-v6';
const CODE_ASSETS = [
  '/',
  'index.html',
  'style.css',
  'main.js',
  'firebase-config.js',
  'admin.html',
  'admin.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching Core Assets');
      return cache.addAll(CODE_ASSETS).catch(err => console.warn('SW: Pre-cache minor fail:', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal && event.request.method === 'GET') {
    // Strategy: Cache-First for everything local (Instant load, save bandwidth)
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
            // Fallback for failed network requests
            return new Response('Network error occurred', { status: 408 });
        });
      })
    );
  }
});
