// CineLog Service Worker v1
const CACHE = 'cinelog-v1';
const ASSETS = [
  '/cinelog/',
  '/cinelog/index.html',
  '/cinelog/manifest.json',
  '/cinelog/icon-192.png',
  '/cinelog/icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'CineLog', {
      body: data.body || '',
      icon: '/cinelog/icon-192.png',
      badge: '/cinelog/icon-192.png',
      tag: 'cinelog-push',
    })
  );
});

// Notification click: open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      for (const c of cs) {
        if (c.url.includes('cinelog') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/cinelog/');
    })
  );
});
