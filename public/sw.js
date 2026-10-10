const CACHE_VERSION = 'v2';
const STATIC_CACHE = `sahadhyayi-static-${CACHE_VERSION}`;
const BOOKS_CACHE = `sahadhyayi-books-${CACHE_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, BOOKS_CACHE];

const APP_SHELL = '/index.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/library',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => !CURRENT_CACHES.includes(key))
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // 1. API requests (Supabase, /api/) - Network only. NEVER cache dynamic/user/auth data.
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // 2. Offline books downloaded by the user
  if (url.pathname.includes('/storage/v1/object/public/books/') || url.pathname.endsWith('.epub')) {
    event.respondWith(
      caches.match(request, { cacheName: BOOKS_CACHE }).then(cachedBook => {
        if (cachedBook) return cachedBook;
        return fetch(request);
      })
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts, icons) - Cache-first with network fallback
  if (
    ['script', 'style', 'image', 'font'].includes(request.destination) ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If offline and requesting an image, let browser fail silently or handle naturally
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
      })
    );
    return;
  }

  // 4. Navigation requests (HTML navigation) - Network-first with app shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_SHELL))
    );
    return;
  }
});

// Support explicit offline book caching via postMessage from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_BOOK_URL' && event.data.url) {
    const bookUrl = event.data.url;
    caches.open(BOOKS_CACHE).then(cache => {
      fetch(bookUrl).then(response => {
        if (response.ok) {
          cache.put(bookUrl, response);
        }
      });
    });
  }
});
