// Service worker: maakt de app installeerbaar en laat hem offline openen.
const CACHE = 'nutripulse-v8';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Eerst netwerk (altijd de nieuwste versie), bij geen verbinding de cache.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isCdn = /(esm\.sh|unpkg\.com|cdn\.tailwindcss\.com)$/.test(url.hostname);
  if (url.origin !== self.location.origin && !isCdn) return; // API-calls niet aanraken

  e.respondWith(
    (url.origin === self.location.origin ? fetch(req.url, { cache: 'no-cache' }) : fetch(req))
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
