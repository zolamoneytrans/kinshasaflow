importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  projectId: "studio-874039458-d0447",
  storageBucket: "studio-874039458-d0447.firebasestorage.app",
  messagingSenderId: "196367644911",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan ', payload);
  const notificationTitle = payload.notification?.title || 'Kinshasa Flow';
  const notificationOptions = {
    body: payload.notification?.body || 'Mise à jour du trafic disponible.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'traffic-alert',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});