/* Positano.app — service worker v0 */
'use strict';

const VERSIONE = 'positano-v0.1.0';
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/i18n.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'data/numeri-utili.json',
  'data/trasporti.json',
  'data/rifiuti.json',
  'data/spiagge.json',
  'data/sentieri.json',
  'data/eventi.json',
  'data/meta.json'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(VERSIONE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSIONE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (ev) {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Navigazioni: prima la rete (per gli aggiornamenti), poi la cache.
  if (req.mode === 'navigate') {
    ev.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(VERSIONE).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () { return caches.match('index.html'); })
    );
    return;
  }

  // Dati JSON: stale-while-revalidate.
  if (url.pathname.indexOf('/data/') !== -1) {
    ev.respondWith(
      caches.open(VERSIONE).then(function (c) {
        return c.match(req).then(function (cached) {
          const rete = fetch(req).then(function (res) {
            if (res && res.ok) c.put(req, res.clone());
            return res;
          }).catch(function () { return cached; });
          return cached || rete;
        });
      })
    );
    return;
  }

  // Tutto il resto: cache-first.
  ev.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSIONE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
