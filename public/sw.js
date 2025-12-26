const CACHE_NAME = 'quran-v4';
const DATA_CACHE_NAME = 'quran-data-v1';
const urlsToCache = [
  '/',
  '/css/all-local.min.css',
  '/fonts/fa-solid-900.woff2',
  '/fonts/fa-regular-400.woff2',
  '/fonts/fa-brands-400.woff2',
  '/fonts/amiri.woff2',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching essential assets');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy for API calls: Network first, then fall back to cache
  if (event.request.url.includes('/api/search')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network is available, update data cache
          const responseToCache = response.clone();
          caches.open(DATA_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from data cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy for assets: Cache first, then fall back to network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
