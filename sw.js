const CACHE_NAME = 'legalease-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // We try to cache core assets. Errors here (e.g. opaque responses) shouldn't break install.
        return cache.addAll(URLS_TO_CACHE).catch(err => console.warn('Cache addAll error:', err));
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that aren't GET or are from API
  if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Don't cache bad responses or API calls
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Simple caching strategy for dynamic ES modules and other assets
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
            // Return nothing or a fallback if offline and not in cache
            // For now, we rely on the App UI to handle the "offline" state visual
            return null; 
        });
      })
  );
});