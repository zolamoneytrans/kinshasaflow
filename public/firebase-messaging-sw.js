
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-sw.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-sw.js');

firebase.initializeApp({
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  projectId: "studio-874039458-d0447",
  storageBucket: "studio-874039458-d0447.firebasestorage.app",
  messagingSenderId: "196367644911",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
