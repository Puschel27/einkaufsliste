// Service Worker: macht die Seite installierbar und lädt sie schneller.
// Strategie "erst Netzwerk, dann Cache", damit Updates sofort ankommen.
const CACHE = 'einkaufsliste-v3';
const DATEIEN = ['./', './index.html', './style.css', './app.js', './config.js',
  './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request)
      .then(res => {
        const kopie = res.clone();
        caches.open(CACHE).then(c => c.put(ev.request, kopie));
        return res;
      })
      .catch(() => caches.match(ev.request))
  );
});
