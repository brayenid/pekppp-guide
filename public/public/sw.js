// public/sw.js
// Service Worker untuk PEKPPP Kutai Barat PWA & Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Notifikasi PEKPPP',
    body: 'Ada pembaruan data evaluasi pelayanan publik.',
    url: '/notifikasi',
    tag: 'pekppp-notification',
    icon: '/pwa/android-chrome-192x192.png',
    badge: '/pwa/favicon-32x32.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa/android-chrome-192x192.png',
    badge: data.badge || '/pwa/favicon-32x32.png',
    data: {
      url: data.url || '/notifikasi'
    },
    tag: data.tag || 'pekppp-notification',
    renotify: true,
    vibrate: [100, 50, 100]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/notifikasi';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika tab sudah terbuka dan cocok, fokuskan
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Jika belum ada window terbuka, buka window baru
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
