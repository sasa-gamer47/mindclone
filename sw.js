
const CACHE_NAME = 'mindclone-v1';

// Only precache the entry points. 
// We rely on runtime caching for the rest to avoid errors with file extensions in different environments.
// Using relative paths ('./') handles cases where the app is not at the domain root.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
          console.warn('Precache failed:', err);
      });
    })
  );
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
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  // API calls to Google or internal logic should not be cached
  if (event.request.url.includes('googleapis') || event.request.method !== 'GET') {
    return;
  }

  const isLocal = event.request.url.startsWith(self.location.origin);

  if (isLocal) {
     // STRATEGY: Network First (for local app files)
     // Try network -> If success, update cache & return -> If fail, return cache
     // This ensures you always see code updates when online.
     event.respondWith(
       fetch(event.request)
         .then(networkRes => {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
            return networkRes;
         })
         .catch(() => caches.match(event.request))
     );
  } else {
     // STRATEGY: Cache First (for CDNs/External Assets)
     // Check cache -> If found, return -> If not, fetch & cache
     event.respondWith(
        caches.match(event.request).then(cachedRes => {
           if (cachedRes) return cachedRes;
           return fetch(event.request).then(networkRes => {
               const resClone = networkRes.clone();
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
               return networkRes;
           });
        })
     );
  }
});