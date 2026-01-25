// ===============================
// BAC SCHOOL PORTAL SERVICE WORKER
// ===============================

const CACHE_NAME = 'school-portal-v4';
const API_CACHE_NAME = 'school-portal-api-v4';
const OFFLINE_PAGE = '/offline.html';

// Static assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// --------------------
// INSTALL
// --------------------
self.addEventListener('install', (event) => {
  console.log('SW: Installing');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// --------------------
// ACTIVATE
// --------------------
self.addEventListener('activate', (event) => {
  console.log('SW: Activating');

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// --------------------
// FETCH
// --------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // 🚫 NEVER CACHE SETUP ENDPOINTS
  if (url.pathname.startsWith('/api/setup')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(event.request));
    return;
  }

  // Static assets
  event.respondWith(cacheFirstStatic(event.request));
});

// --------------------
// API: NETWORK FIRST
// --------------------
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({
        offline: true,
        message: 'Offline mode',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// --------------------
// STATIC: CACHE FIRST
// --------------------
async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    if (request.headers.get('accept')?.includes('text/html')) {
      return cache.match(OFFLINE_PAGE);
    }

    return new Response('Offline', { status: 503 });
  }
}
