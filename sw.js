const CACHE = 'moto-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isPage = req.mode === 'navigate' || req.destination === 'document'
    || req.url.endsWith('/') || req.url.endsWith('index.html');
  if (isPage) {
    // network-first: свежий код при интернете, кэш — оффлайн
    e.respondWith(
      fetch(req).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put('./index.html', cp));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // cache-first для иконок/манифеста
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(r =>
        r || fetch(req).then(resp => {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
          return resp;
        })
      )
    );
  }
});
