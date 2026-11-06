/* Сервис-воркер: офлайн-кэш приложения */
const CACHE = 'fitness-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const heavy = /\.(png|jpe?g|webp|ico)$/i.test(url.pathname); // картинки — cache-first
  const strategy = (isCacheFirst) =>
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          const ok = res && res.ok && url.origin === location.origin;
          if (ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          if (!cached && e.request.mode === 'navigate') return caches.match('./');
          return cached;
        });
      return isCacheFirst ? (cached || network) : network;
    });
  e.respondWith(strategy(heavy));
});
