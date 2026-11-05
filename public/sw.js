/* Positano.app · service worker v0.2
   - Tutta la guida viene salvata alla prima visita (funziona senza rete).
   - Pagine, codice e dati: prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata.
     Se la rete non risponde entro 3 secondi si usa la copia: in spiaggia con una tacca non si aspetta. */
'use strict';

const VERSIONE = 'positano-v0.5.0';
const SHELL = [
  './', 'index.html', 'css/style.css', 'js/app.js', 'js/i18n.js', 'js/oggi.js', 'js/post.js', 'js/comune.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'fonts/montserrat-latin.woff2', 'fonts/cormorant-garamond-latin.woff2',
  'data/numeri-utili.json', 'data/trasporti.json', 'data/rifiuti.json', 'data/spiagge.json', 'data/sentieri.json',
  'data/eventi.json', 'data/luoghi.json', 'data/comune.json', 'data/avvisi.json', 'data/meta.json',
  'data/servizi.json', 'data/chi-chiamo.json', 'data/regole.json', 'data/home.json', 'data/allerta.json', 'data/meteo.json', 'data/avvisi-comune.json'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(VERSIONE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSIONE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function conTimeout(p, ms) {
  return new Promise(function (resolve, reject) {
    const t = setTimeout(function () { reject(new Error('timeout')); }, ms);
    p.then(function (r) { clearTimeout(t); resolve(r); }, function (e) { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', function (ev) {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Il pannello di redazione non passa mai dalla cache; i dati pubblici sì, per l'uso offline.
  if (url.pathname.indexOf('/api/') === 0 && url.pathname !== '/api/pubblico') return;
  if (url.pathname.indexOf('/admin') === 0 || url.pathname.indexOf('js/admin.js') !== -1) return;
  const chiave = req.mode === 'navigate' ? 'index.html' : req;

  const rete = fetch(req).then(function (res) {
    if (res && res.ok) {
      const copia = res.clone();
      caches.open(VERSIONE).then(function (c) { c.put(chiave, copia); });
    }
    return res;
  });
  rete.catch(function () { /* offline: gestito sotto */ });

  ev.respondWith(
    conTimeout(rete, 3000).catch(function () {
      return caches.match(chiave).then(function (cached) { return cached || rete; });
    })
  );
});

/* Notifiche push del Comune: titolo, testo e pagina dell'app da aprire. */
self.addEventListener('push', function (ev) {
  let d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch (e) { d = { titolo: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(d.titolo || 'Positano.app', {
    body: d.testo || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: d.tag || 'positano', data: { url: d.url || '#avvisi' }, lang: 'it'
  }));
});
self.addEventListener('notificationclick', function (ev) {
  ev.notification.close();
  const dest = new URL('./' + ((ev.notification.data && ev.notification.data.url) || ''), self.registration.scope).href;
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (const c of list) { if ('focus' in c) { c.navigate(dest).catch(function () {}); return c.focus(); } }
    return self.clients.openWindow(dest);
  }));
});
