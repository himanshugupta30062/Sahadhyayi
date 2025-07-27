const CACHE_NAME = 'sahadhyayi-cache-v1';
const APP_SHELL = '/index.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/library',
  '/manifest.json',
  '/favicon.ico'
];

// Supabase domain for API request identification
const SUPABASE_DOMAIN = 'rknxtatvlzunatpyqxro.supabase.co';

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;

  // 1. Handle API requests (Supabase or local API) - Network-first, never fallback to HTML
  if (url.hostname === SUPABASE_DOMAIN || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses for future offline access
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(error => {
          console.warn('[ServiceWorker] API request failed:', request.url, error);
          
          // Try to serve from cache for API requests
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('[ServiceWorker] Serving API response from cache:', request.url);
              return cachedResponse;
            }
            
            // Return proper JSON error response instead of HTML
            return new Response(
              JSON.stringify({ 
                error: 'Network request failed', 
                message: 'Unable to reach server. Please check your connection.',
                offline: true 
              }), 
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache'
                }
              }
            );
          });
        })
    );
    return;
  }

  // 2. Handle static assets (JS/CSS/images/fonts/PDFs) - Cache-first strategy
  if (
    ['script', 'style', 'image', 'font'].includes(request.destination) ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          console.log('[ServiceWorker] Serving static asset from cache:', request.url);
          return response;
        }
        
        // Fetch and cache static assets
        return fetch(request).then(fetchResponse => {
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        }).catch(error => {
          console.warn('[ServiceWorker] Static asset request failed:', request.url, error);
          throw error; // Let the browser handle the error naturally
        });
      })
    );
    return;
  }

  // 3. Handle navigation requests (page loads/refresh) - Network-first, fallback to app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('[ServiceWorker] Navigation request failed, serving app shell:', request.url, error);
          return caches.match(APP_SHELL);
        })
    );
    return;
  }

  // 4. Default: Let other requests pass through normally
  event.respondWith(fetch(request));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
