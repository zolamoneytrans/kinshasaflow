importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  projectId: "studio-874039458-d0447",
  storageBucket: "studio-874039458-d0447.appspot.com",
  messagingSenderId: "196367644911",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'Kinshasa Flow';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
