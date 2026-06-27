self.addEventListener('push', function (event) {
  const data = JSON.parse(event.data.text());
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/globe.svg', // Icono básico, cambiar a logo en el futuro
      badge: '/globe.svg',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/admin/dashboard'
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Si la ventana ya está abierta, enfocarse en ella
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});
