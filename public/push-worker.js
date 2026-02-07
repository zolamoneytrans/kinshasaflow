'use strict';

self.addEventListener('push', function (event) {
    const data = event.data.json();
    const title = data.title || 'Kinshasa Flow';
    const options = {
        body: data.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        data: {
            url: data.url || '/'
        }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
