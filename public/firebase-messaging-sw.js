// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// You can find these values in your Firebase Console (Project Settings > General).
firebase.initializeApp({
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  projectId: "studio-874039458-d0447",
  storageBucket: "studio-874039458-d0447.appspot.com",
  messagingSenderId: "196367644911",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
