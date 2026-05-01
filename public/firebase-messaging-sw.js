importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuration Firebase (doit correspondre à src/firebase/config.ts)
// Note: Le Service Worker n'a pas accès aux variables d'environnement de build Next.js directement
firebase.initializeApp({
  "projectId": "studio-874039458-d0447",
  "appId": "1:196367644911:web:74bd118b2cb442b1dc031a",
  "apiKey": "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  "authDomain": "studio-874039458-d0447.firebaseapp.com",
  "messagingSenderId": "196367644911",
  "storageBucket": "studio-874039458-d0447.firebasestorage.app"
});

const messaging = firebase.messaging();

// Gestion des messages reçus en arrière-plan (App fermée ou onglet inactif)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification.title || 'Kinshasa Flow';
  const notificationOptions = {
    body: payload.notification.body || 'Nouvelle mise à jour du trafic.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Voir le trajet' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Listener pour l'ouverture de la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});