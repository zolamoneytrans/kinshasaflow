importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These values are public and safe to include in the service worker.
// They will be replaced by your actual config during the build process if using Firebase App Hosting,
// or you can manually paste your firebaseConfig object here if needed.
const firebaseConfig = {
  apiKey: "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  authDomain: "studio-874039458-d0447.firebaseapp.com",
  projectId: "studio-874039458-d0447",
  storageBucket: "studio-874039458-d0447.appspot.com",
  messagingSenderId: "196367644911",
  appId: "1:196367644911:web:74bd118b2cb442b1dc031a"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
