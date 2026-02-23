'use strict';

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
