// Ce script s'exécute en arrière-plan et gère les notifications lorsque l'onglet est fermé.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "studio-874039458-d0447",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a",
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  storageBucket: "studio-874039458-d0447.appspot.com",
  messagingSenderId: "196367644911"
});

const messaging = firebase.messaging();

// Gère les messages reçus pendant que l'application est en arrière-plan.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // Assurez-vous que ce fichier existe dans /public
    data: {
        url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gère le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
