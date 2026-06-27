const CACHE_NAME = 'psp-cache-v1';
const OFFLINE_URL = '/offline.html';

// === INSTALL: Pre-cachear la página offline ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/globe_192.png',
        '/globe_512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// === ACTIVATE: Limpiar caches viejos y tomar control ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// === FETCH: Network First para navegación, Cache First para assets estáticos ===
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo interceptar requests GET
  if (request.method !== 'GET') return;

  // Ignorar requests a APIs y Server Actions de Next.js
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return;

  // --- NAVEGACIÓN (páginas HTML) → Network First con offline fallback ---
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear la respuesta exitosa para uso futuro
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Sin red: intentar cache primero, luego offline.html
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // --- ASSETS ESTÁTICOS (JS, CSS, imágenes) → Cache First ---
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Si falla y no hay cache, devolver respuesta vacía para no romper nada
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
    );
    return;
  }
});

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', function (event) {
  if (!event.data) return;
  
  let data;
  try {
    data = JSON.parse(event.data.text());
  } catch (err) {
    data = {
      title: 'Notificación del Sistema',
      body: event.data.text(),
      url: '/admin/dashboard'
    };
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/globe_192.png',
      badge: '/globe_192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/admin/dashboard'
      }
    })
  );
});

// === NOTIFICATION CLICK ===
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});