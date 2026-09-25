/* Service Worker — NGA CIPA
   Guarda o folder no aparelho no primeiro acesso com internet, para que as
   consultas seguintes funcionem offline. O PDF (14 MB) não é baixado de início:
   fica salvo a partir da primeira vez que for aberto. */

const CACHE = 'nga-cipa-v1';

const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ESSENCIAIS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.map(n => n === CACHE ? null : caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Página: rede primeiro (pega atualizações das NGA), cache se estiver offline.
   Demais arquivos: cache primeiro, e o que vier da rede é guardado. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia));
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(salvo => salvo || fetch(req).then(resp => {
      if (resp.ok && resp.status === 200) {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copia));
      }
      return resp;
    }))
  );
});
