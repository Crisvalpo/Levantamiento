/* PipEI Levantamiento - service worker: la app debe abrir sin señal en obra. */
const CACHE = 'pipei-lev-v6';




const ASSETS = ['./','./index.html','./styles.css','./data.js','./app.js','./sync.js','./config.js','./manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // nunca cachear Supabase ni IA

  // Network-First cuando hay señal para actualizar al instante; fallback a Caché offline
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});

