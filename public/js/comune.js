/* Positano.app · pagine «Albo pretorio», «Consiglio comunale», «Mappa» e «La tua zona e notifiche».
   Albo e Consiglio arrivano dall'osservatore dell'Albo pretorio del Comune (Worker, ogni 2 ore) tramite /api/pubblico.
   Fa sempre fede l'atto pubblicato sul sito del Comune: qui ci sono sintesi e collegamenti. */
(function () {
  'use strict';

  const ALBO_UFFICIALE = 'https://servizionline.hspromilaprod.hypersicapp.net/cmspositano/portale/albopretorio/albopretorioconsultazione.aspx?P=400';
  const GRUPPI_ALBO = [
    ['ordinanze', /ordinanz/i], ['avvisi', /avvis|band/i], ['giunta', /giunta/i], ['consiglio', /delibere di consiglio|convocazione/i], ['decreti', /decret/i]
  ];

  /* Gli oggetti dell'Albo sono in maiuscolo: li rendiamo leggibili (prima lettera maiuscola, sigle note intatte). */
  function leggibile(s) {
    s = String(s || '').trim();
    const lettere = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (!lettere || lettere.replace(/[^A-ZÀ-Þ]/g, '').length / lettere.length < 0.6) return s;
    let x = s.toLowerCase().replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, function (m, p, c) { return p + c.toUpperCase(); });
    ['Positano', 'Comune', 'Consiglio Comunale', 'Giunta Comunale', 'Sindaca', 'Regione Campania', 'Ausino', 'S.p.A.', 'Halloween', 'Montepertuso', 'Nocelle', 'Laurito', 'Fornillo', 'Arienzo', 'Liparlati', 'Viterbo',
      'Natale', 'Salerno', 'Praiano', 'Amalfi', 'Sorrento', 'Costiera Amalfitana', 'Tari', 'Imu', 'Pnrr', 'Asl', 'Anas', 'Sita', 'Cai', 'Unesco', 'Statuto', 'Forze Armate'].forEach(function (w) {
      x = x.replace(new RegExp('\\b' + w.toLowerCase().replace(/\./g, '\\.') + '\\b', 'g'), w);
    });
    return x;
  }
  function deliberaInfo(o) {
    const m = String(o).match(/^Delibera:\s*(Giunta|Consiglio) Comunale\s+N\.?\s*(\d+)\s+DEL\s+(\d{2})\/(\d{2})\/(\d{4})\s*:\s*([\s\S]*)$/i);
    return m ? { organo: m[1], numero: m[2], data: m[5] + '-' + m[4] + '-' + m[3], oggetto: m[6] } : null;
  }
  function dataSeduta(o) {
    const m = String(o).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return null;
    const h = String(o).match(/ORE\s+(\d{1,2})[.:](\d{2})/i);
    return { data: m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'), ora: h ? h[1].padStart(2, '0') + ':' + h[2] : '' };
  }
  function fonteSA(A, api) {
    if (!api || !api.fonti || !api.fonti.albo) return '';
    return '<p class="src">' + A.esc(A.t('albo.fonte')) + ' · ' + A.esc(A.t('common.checked')) + ' ' + A.esc(A.dateLabel(A.O.isoRome(new Date(api.fonti.albo)), { month: 'short' })) + '</p>';
  }

  /* ---------- Albo ---------- */
  function renderAlbo(A) {
    return A.loadAPI().then(function (api) {
      const esc = A.esc, t = A.t, iso = A.today();
      let h = A.sectionHeader('albo', t('albo.intro'));
      const atti = (api && api.albo || []).filter(function (a) { return !a.pub_a || a.pub_a >= iso; });
      if (!api) return h + '<p class="note">' + esc(t('common.offline')) + '</p>';
      if (!atti.length) h += '<p class="note">' + esc(t('albo.vuoto')) + '</p>';
      GRUPPI_ALBO.forEach(function (g) {
        const lista = atti.filter(function (a) { return g[1].test(a.categoria) && (g[0] !== 'avvisi' || !/convocazione/i.test(a.categoria)); });
        if (!lista.length) return;
        h += '<h2 class="titolo-sez">' + esc(t('albo.g.' + g[0])) + ' · ' + lista.length + '</h2><div class="avvisi">' + lista.map(function (a) { return attoCard(A, a); }).join('') + '</div>';
      });
      h += '<p><a class="btn secondario" href="' + ALBO_UFFICIALE + '" rel="noopener">' + A.icon('link') + ' ' + esc(t('albo.ufficiale')) + '</a></p>';
      h += '<p class="note">' + esc(t('albo.nota')) + '</p>' + fonteSA(A, api);
      return h + A.reportLine('albo');
    });
  }
  function attoCard(A, a) {
    const esc = A.esc, t = A.t, d = deliberaInfo(a.oggetto);
    const titolo = leggibile(d ? d.oggetto : a.oggetto);
    const meta = d ? t('albo.delibera', { o: t(d.organo === 'Giunta' ? 'albo.giunta' : 'albo.consiglio'), n: d.numero, d: A.dateLabel(d.data, { year: 'numeric', month: 'short' }) }) : leggibile(a.categoria);
    let h = '<article class="atto" id="v-a' + esc(a.registro) + '"><p class="atto-meta">' + esc(meta) + (a.pub_a ? ' · ' + esc(t('albo.fino', { d: A.dateLabel(a.pub_a, { month: 'short' }) })) : '') + '</p>';
    h += '<h3>' + esc(titolo) + '</h3>';
    if (a.breve && A.pick(a.breve)) h += '<p class="breve"><span class="ai-tag">' + esc(t('albo.breve')) + '</span> ' + esc(A.pick(a.breve)) + '</p>';
    return h + '<p class="src">' + esc(t('albo.registro', { n: a.registro })) + '</p></article>';
  }

  /* ---------- Consiglio comunale ---------- */
  function renderConsiglio(A) {
    return A.loadAPI().then(function (api) {
      const esc = A.esc, t = A.t, iso = A.today();
      let h = A.sectionHeader('consiglio', t('consiglio.intro'));
      if (!api) return h + '<p class="note">' + esc(t('common.offline')) + '</p>';
      const c = api.consiglio || {}, red = c.redazione || {};
      const pr = red.prossima && red.prossima.data >= iso ? red.prossima : null;
      const conv = (c.convocazioni || []).map(function (x) { return Object.assign({ seduta: dataSeduta(x.oggetto) }, x); });
      const prossimaAlbo = !pr && conv.find(function (x) { return x.seduta && x.seduta.data >= iso; });
      if (pr || prossimaAlbo) {
        const s = pr || prossimaAlbo.seduta;
        h += '<div class="seduta"><div class="occhiello" style="' + A.catStyle('istituzionale') + '"><span>' + esc(t('consiglio.prossima')) + '</span><span>' + esc(A.relDay(s.data)) + '</span></div><div class="filo"></div><div class="corpo">' +
          '<h2>' + esc(A.dateLabel(s.data, { weekday: 'long', year: 'numeric' })) + (s.ora ? ' · ' + esc(s.ora) : '') + '</h2>';
        if (pr && pr.luogo) h += '<p class="addr">' + A.icon('pin') + '<span>' + esc(pr.luogo) + '</span></p>';
        if (pr && pr.odg) h += '<h3>' + esc(t('consiglio.odg')) + '</h3><ol class="odg">' + pr.odg.split(/\n+/).filter(Boolean).map(function (r) { return '<li>' + esc(r.replace(/^\s*\d+[.)]\s*/, '')) + '</li>'; }).join('') + '</ol>';
        const acts = [];
        if (pr && pr.odg_url) acts.push('<a class="act" href="' + esc(pr.odg_url) + '" rel="noopener">' + A.icon('albo') + '<span>' + esc(t('consiglio.odg.doc')) + '</span></a>');
        if (red.diretta_url) acts.push('<a class="act" href="' + esc(red.diretta_url) + '" rel="noopener">' + A.icon('link') + '<span>' + esc(t('consiglio.diretta')) + '</span></a>');
        if (acts.length) h += '<div class="acts">' + acts.join('') + '</div>';
        h += '<p class="note">' + esc(t('consiglio.pubblica')) + '</p></div></div>';
      } else {
        h += '<p class="note">' + esc(t('consiglio.nessuna')) + '</p>';
        if (red.diretta_url) h += '<p><a class="btn secondario" href="' + esc(red.diretta_url) + '" rel="noopener">' + esc(t('consiglio.diretta')) + '</a></p>';
      }
      if (red.nota) h += '<p class="callout">' + esc(red.nota) + '</p>';
      // Delibere raggruppate per seduta
      const sedute = {};
      (c.delibere || []).forEach(function (x) { const d = deliberaInfo(x.oggetto); if (!d) return; (sedute[d.data] = sedute[d.data] || []).push(d); });
      const date = Object.keys(sedute).sort().reverse();
      if (date.length) {
        h += '<h2 class="titolo-sez">' + esc(t('consiglio.decisioni')) + '</h2>';
        date.slice(0, 4).forEach(function (d) {
          const lista = sedute[d].sort(function (a, b) { return a.numero - b.numero; });
          h += '<details class="seduta-passata"' + (d === date[0] ? ' open' : '') + '><summary><strong>' + esc(t('consiglio.seduta', { d: A.dateLabel(d, { year: 'numeric' }) })) + '</strong><small>' + esc(t('consiglio.n', { n: lista.length })) + '</small></summary><ol class="delibere">' +
            lista.map(function (x) { return '<li value="' + esc(x.numero) + '">' + esc(leggibile(x.oggetto)) + '</li>'; }).join('') + '</ol></details>';
        });
      }
      if (conv.length) {
        h += '<h2 class="titolo-sez">' + esc(t('consiglio.convocazioni')) + '</h2><div class="menu">' + conv.map(function (x) {
          return '<a class="menu-row" href="' + ALBO_UFFICIALE + '" rel="noopener"><span class="menu-b" style="background:var(--c-istituzionale)"></span><span><strong>' + esc(leggibile(x.oggetto)) + '</strong><small>' +
            esc(t('albo.registro', { n: x.registro })) + '</small></span>' + A.icon('link', 'chev') + '</a>';
        }).join('') + '</div>';
      }
      h += '<p><a class="btn secondario" href="' + ALBO_UFFICIALE + '" rel="noopener">' + A.icon('link') + ' ' + esc(t('albo.ufficiale')) + '</a></p>';
      return h + fonteSA(A, api) + A.reportLine('consiglio');
    });
  }

  /* ---------- Mappa offline ---------- */
  const TIPI_MAPPA = {
    defibrillatore: { c: '#B71523', ic: 'sos' }, fermata: { c: '#1877BD', ic: 'bus' }, porto: { c: '#004C77', ic: 'boat' }, farmacia: { c: '#00966B', ic: 'cross' },
    sanita: { c: '#B71523', ic: 'cross' }, sicurezza: { c: '#172C70', ic: 'scudo' }, comune: { c: '#007A8E', ic: 'townhall' }, spiaggia: { c: '#E97A28', ic: 'beach' },
    luogo: { c: '#CA1D6B', ic: 'eye' }, sentiero: { c: '#5E7A12', ic: 'hike' }, bagni: { c: '#7D6F64', ic: 'info' }, chiesa: { c: '#9B72AA', ic: 'eye' }
  };
  let filtroMappa = '';
  function puntiNostri(A) {
    return Promise.all(['luoghi', 'spiagge', 'trasporti', 'numeri-utili', 'sentieri'].map(A.loadJSON)).then(function (r) {
      const out = [];
      const tipo = { luoghi: 'luogo', spiagge: 'spiaggia', trasporti: 'fermata', 'numeri-utili': 'sanita', sentieri: 'sentiero' };
      ['luoghi', 'spiagge', 'trasporti', 'numeri-utili', 'sentieri'].forEach(function (f, i) {
        (function giro(x) {
          if (Array.isArray(x)) x.forEach(giro);
          else if (x && typeof x === 'object') {
            if (x.coord && x.coord.length === 2 && (x.nome || x.titolo)) {
              let tp = tipo[f];
              if (f === 'trasporti' && /travelmar|traghett|ferry/i.test(JSON.stringify(x.nome || x.titolo))) tp = 'porto';
              if (f === 'numeri-utili' && /capitaneria|guardia costiera/i.test(JSON.stringify(x.nome || x.titolo))) tp = 'sicurezza';
              out.push({ id: 'n-' + f + '-' + (x.id || out.length), tipo: tp, nome: A.pick(x.nome || x.titolo), lat: x.coord[0], lon: x.coord[1], link: '#' + ({ luoghi: 'luoghi', spiagge: 'mare', trasporti: 'muoversi', 'numeri-utili': 'emergenze', sentieri: 'sentieri' }[f]) + '/' + (x.id || '') });
            }
            Object.keys(x).forEach(function (k) { if (k !== 'coord') giro(x[k]); });
          }
        })(r[i]);
      });
      return out;
    });
  }
  function renderMappa(A, item) {
    return Promise.all([A.loadJSON('mappa'), puntiNostri(A)]).then(function (r) {
      const esc = A.esc, t = A.t, osm = r[0];
      let punti = r[1].concat(osm && osm.punti ? osm.punti.filter(function (p) { return p.tipo !== 'spiaggia' || !r[1].some(function (q) { return q.tipo === 'spiaggia' && Math.abs(q.lat - p.lat) < 0.002 && Math.abs(q.lon - p.lon) < 0.002; }); }) : []);
      const tipi = Object.keys(TIPI_MAPPA).filter(function (k) { return punti.some(function (p) { return p.tipo === k; }); });
      const bb = osm && osm.bbox || [40.6155, 14.47, 40.642, 14.542];
      const W = 1000, kx = Math.cos(40.63 * Math.PI / 180), H = Math.round(W * (bb[2] - bb[0]) / ((bb[3] - bb[1]) * kx));
      const X = function (lon) { return ((lon - bb[1]) / (bb[3] - bb[1]) * W).toFixed(1); };
      const Y = function (lat) { return ((bb[2] - lat) / (bb[2] - bb[0]) * H).toFixed(1); };
      const linea = function (l) { return 'M' + l.map(function (p) { return X(p[0]) + ' ' + Y(p[1]); }).join('L'); };
      const vis = punti.filter(function (p) { return !filtroMappa || p.tipo === filtroMappa; });
      let h = A.sectionHeader('mappa', t('mappa.intro'));
      h += '<div class="filtri" role="group" aria-label="' + esc(t('mappa.filtra')) + '"><button type="button" class="filtro" data-filtro-mappa="" aria-pressed="' + (!filtroMappa) + '">' + esc(t('mappa.tutto')) + '</button>' +
        tipi.map(function (k) { return '<button type="button" class="filtro" data-filtro-mappa="' + k + '" aria-pressed="' + (filtroMappa === k) + '"><i class="punto-m" style="background:' + TIPI_MAPPA[k].c + '"></i>' + esc(t('mappa.t.' + k)) + '</button>'; }).join('') + '</div>';
      h += '<figure class="mappa"><svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(t('mappa.svg')) + '"><rect width="' + W + '" height="' + H + '" fill="#DCEBF2"/>';
      if (osm && osm.costa) {
        h += '<path d="' + osm.costa.map(linea).join('') + '" fill="none" stroke="#7FA9BC" stroke-width="3"/>';
        h += (osm.strade || []).map(function (s) { return '<path d="' + linea(s.l) + '" fill="none" stroke="' + (s.k ? '#FFFFFF' : '#F5F2EC') + '" stroke-width="' + (s.k ? 7 : 3.5) + '" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>'; }).join('');
      }
      vis.forEach(function (p, i) {
        const tp = TIPI_MAPPA[p.tipo] || TIPI_MAPPA.luogo;
        h += '<a href="#mappa/' + esc(p.id) + '" aria-label="' + esc(p.nome || t('mappa.t.' + p.tipo)) + '"><circle cx="' + X(p.lon) + '" cy="' + Y(p.lat) + '" r="' + (item === p.id ? 17 : 11) + '" fill="' + tp.c + '" stroke="#fff" stroke-width="3"/></a>';
      });
      h += '</svg>';
      if (!osm) h += '<figcaption class="note">' + esc(t('mappa.senzaosm')) + '</figcaption>';
      h += '</figure>';
      // Elenco accessibile, raggruppato per tipo
      tipi.filter(function (k) { return !filtroMappa || k === filtroMappa; }).forEach(function (k) {
        const lista = vis.filter(function (p) { return p.tipo === k; }).sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome)); });
        h += '<h2 class="titolo-sez"><i class="punto-m" style="background:' + TIPI_MAPPA[k].c + '"></i>' + esc(t('mappa.t.' + k)) + ' · ' + lista.length + '</h2><div class="menu">' + lista.map(function (p) {
          return '<div class="menu-row riga-mappa" id="v-' + esc(p.id) + '"><span class="menu-b" style="background:' + TIPI_MAPPA[k].c + '"></span>' + A.icon(TIPI_MAPPA[k].ic) + '<span><strong>' + esc(p.nome || t('mappa.t.' + k)) + '</strong>' +
            (p.nota ? '<small>' + esc(p.nota) + '</small>' : '') + '</span><span class="riga-azioni">' + (p.link ? '<a class="act piccolo" href="' + esc(p.link) + '">' + esc(t('mappa.scheda')) + '</a>' : '') +
            '<a class="act piccolo" href="' + esc(A.mapHref([p.lat, p.lon], p.nome)) + '" rel="noopener">' + A.icon('pin') + '<span>' + esc(t('mappa.apri')) + '</span></a></span></div>';
        }).join('') + '</div>';
      });
      h += '<p class="src">' + esc(t('common.source')) + ': ' + esc(t('mappa.fonte')) + (osm ? ' · <a href="' + esc(osm.fonte.url) + '" rel="noopener">' + esc(osm.fonte.nome) + '</a> · ' + esc(A.dateLabel(osm.aggiornato, { month: 'short', year: 'numeric' })) : '') + '</p>';
      return h + A.reportLine('mappa');
    });
  }

  /* ---------- La tua zona e notifiche ---------- */
  function pushSupportato() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function iosNonInstallata() { return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches); }
  function iscrizioneAttuale() {
    if (!pushSupportato()) return Promise.resolve(null);
    return navigator.serviceWorker.getRegistration().then(function (reg) { return reg ? reg.pushManager.getSubscription() : null; }).catch(function () { return null; });
  }
  function renderZona(A) {
    return Promise.all([A.loadAPI(), iscrizioneAttuale()]).then(function (r) {
      const esc = A.esc, t = A.t, api = r[0], sub = r[1], zone = (api && api.zone) || [], z = A.miaZona();
      let h = A.sectionHeader('zona', t('zona.intro'));
      h += '<div class="scheda-z"><h2>' + esc(t('zona.tua')) + '</h2>';
      h += zone.length ? '<label class="scegli-zona">' + esc(t('zona.scegli')) + '<select data-zona><option value="">' + esc(t('zona.tutte')) + '</option>' + zone.map(function (x) { return '<option' + (x === z ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
        '<p class="note">' + esc(t('zona.locale')) + '</p>' : '<p class="note">' + esc(t('common.offline')) + '</p>';
      h += '</div><div class="scheda-z"><h2>' + A.icon('campana') + ' ' + esc(t('notifiche.titolo')) + '</h2><p>' + esc(t('notifiche.cosa')) + '</p>';
      if (!pushSupportato()) h += '<p class="note">' + esc(t('notifiche.nosupporto')) + '</p>';
      else if (iosNonInstallata()) h += '<p class="callout">' + esc(t('notifiche.ios')) + '</p>';
      else if (Notification.permission === 'denied') h += '<p class="callout">' + esc(t('notifiche.negate')) + '</p>';
      else if (sub) h += '<p class="ok-riga">' + A.icon('campana') + ' ' + esc(t('notifiche.attive', { z: z || t('zona.tutte') })) + '</p><div class="acts"><button type="button" class="btn secondario" id="push-aggiorna">' + esc(t('notifiche.aggiorna')) + '</button><button type="button" class="btn secondario" id="push-off">' + esc(t('notifiche.off')) + '</button></div>';
      else h += '<button type="button" class="btn" id="push-on">' + esc(t('notifiche.on')) + '</button>';
      h += '<p class="note">' + esc(t('notifiche.privacy')) + '</p></div>';
      const c = api && api.canali;
      if (c && c.whatsapp) {
        h += '<div class="scheda-z"><h2>' + A.icon('chat') + ' ' + esc(t('canale.k')) + '</h2><p>' + esc(t('canale.cosa')) + '</p><a class="btn" href="' + esc(c.whatsapp) + '" rel="noopener">' + esc(t('canale.apri')) + '</a></div>';
      }
      return h;
    });
  }
  function iscrivi(A, aggiorna) {
    const t = A.t;
    return Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw new Error(t('notifiche.negate'));
      return Promise.all([navigator.serviceWorker.ready, fetch('api/push/chiave').then(function (r) { return r.json(); })]);
    }).then(function (r) {
      const reg = r[0], chiave = r[1].chiave;
      const raw = atob(chiave.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((chiave.length + 3) % 4));
      const key = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);
      return reg.pushManager.getSubscription().then(function (s) { return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }); });
    }).then(function (sub) {
      const j = sub.toJSON(), z = A.miaZona();
      return fetch('api/push/iscrivi', { method: 'POST', body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, zone: z ? [z] : [], lingua: A.getLang() }) }).then(function (r) {
        if (!r.ok) throw new Error(t('notifiche.errore'));
        A.toast(t(aggiorna ? 'notifiche.aggiornate' : 'notifiche.ok'));
      });
    }).catch(function (e) { A.toast(e.message || t('notifiche.errore')); }).then(function () { A.route(); });
  }
  function disiscrivi(A) {
    return iscrizioneAttuale().then(function (sub) {
      if (!sub) return;
      return fetch('api/push/esci', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(function () {}).then(function () { return sub.unsubscribe(); });
    }).then(function () { A.toast(A.t('notifiche.spente')); A.route(); });
  }

  let A0 = null;
  document.addEventListener('click', function (ev) {
    if (!A0) return;
    const fm = ev.target.closest('[data-filtro-mappa]');
    if (fm) { filtroMappa = fm.getAttribute('data-filtro-mappa'); A0.route(); return; }
    if (ev.target.closest('#push-on')) { iscrivi(A0, false); return; }
    if (ev.target.closest('#push-aggiorna')) { iscrivi(A0, true); return; }
    if (ev.target.closest('#push-off')) disiscrivi(A0);
  });

  window.PA_COMUNE = {
    render: function (page, A, item) {
      A0 = A;
      if (page === 'albo') return renderAlbo(A);
      if (page === 'consiglio') return renderConsiglio(A);
      if (page === 'mappa') return renderMappa(A, item);
      return renderZona(A);
    },
    init: function (page, A) { A0 = A; },
    leggibile: leggibile, dataSeduta: dataSeduta, deliberaInfo: deliberaInfo
  };
})();
