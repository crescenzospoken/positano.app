/* Positano.app · logica applicativa v0.3 (vanilla JS, nessuna build)
   Dati: file JSON in data/ (aggiornati a mano o dalle automazioni) + /api/pubblico (pannello di redazione). */
(function () {
  'use strict';

  const I = window.PA_I18N, O = window.PA_OGGI;
  const t = I.t, getLang = I.getLang;

  /* Sezioni: id, file dati, icona, categoria (colore del design system). Ordine della pagina «Tutto». */
  const SECTIONS = [
    { id: 'avvisi', file: null, icon: 'megafono', cat: 'istituzionale' },
    { id: 'emergenze', file: 'numeri-utili', icon: 'sos', cat: 'emergenze' },
    { id: 'servizi', file: 'servizi', icon: 'townhall', cat: 'comunicati' },
    { id: 'chiamo', file: 'chi-chiamo', icon: 'help', cat: 'istituzionale' },
    { id: 'muoversi', file: 'trasporti', icon: 'bus', cat: 'viabilita' },
    { id: 'rifiuti', file: 'rifiuti', icon: 'recycle', cat: 'ambiente' },
    { id: 'inverno', file: null, icon: 'snow', cat: 'extra' },
    { id: 'eventi', file: 'eventi', icon: 'calendar', cat: 'cultura' },
    { id: 'regole', file: 'regole', icon: 'scudo', cat: 'lavori' },
    { id: 'mare', file: 'spiagge', icon: 'beach', cat: 'turismo' },
    { id: 'sentieri', file: 'sentieri', icon: 'hike', cat: 'ambiente' },
    { id: 'luoghi', file: 'luoghi', icon: 'eye', cat: 'turismo' },
    { id: 'comune', file: 'comune', icon: 'townhall', cat: 'istituzionale' },
    { id: 'info', file: null, icon: 'info', cat: 'extra' },
    { id: 'post', file: null, icon: 'immagine', cat: 'comunicati', nascosta: true }
  ];
  const TABS = ['home', 'emergenze', 'servizi', 'muoversi', 'tutto'];
  const ALL_FILES = ['numeri-utili', 'trasporti', 'rifiuti', 'spiagge', 'sentieri', 'eventi', 'luoghi', 'comune', 'servizi', 'chi-chiamo', 'regole', 'avvisi', 'meta'];
  const cache = {};
  const view = document.getElementById('view');
  let firstRender = true;
  let deferredInstall = null;
  const stato = { filtroEventi: 'tutti', filtroInverno: 'tutti', soloAperti: false };

  /* ---------- utilità ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(field) {
    if (field == null) return '';
    if (typeof field === 'object') return field[getLang()] || field.it || '';
    return String(field);
  }
  function icon(name, cls) { return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function section(id) { return SECTIONS.find(function (s) { return s.id === id; }); }
  function today() { return O.isoRome(); }
  function dateLabel(iso, opts) { return O.formatDate(iso, getLang(), opts); }
  function relDay(iso) {
    const n = O.daysBetween(today(), iso);
    if (n <= 0) return t('common.today');
    if (n === 1) return t('common.tomorrow');
    return t('common.indays', { n: n });
  }
  function catStyle(cat) { const c = cat || 'istituzionale'; return 'background:var(--c-' + c + ');color:var(--t-' + c + ')'; }
  function banda(cat, testo) { return '<span class="banda" style="' + catStyle(cat) + '">' + esc(testo) + '</span>'; }

  function loadJSON(name) {
    if (cache[name] !== undefined) return Promise.resolve(cache[name]);
    return fetch('data/' + name + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache[name] = j; return j; })
      .catch(function () { return null; });
  }
  /* Dati del pannello di redazione (aperture invernali, avvisi, impostazioni della home). */
  function loadAPI() {
    if (cache._api !== undefined) return Promise.resolve(cache._api);
    return fetch('api/pubblico')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache._api = j; return j; })
      .catch(function () { cache._api = null; return null; });
  }

  function badges(v) {
    let out = '';
    if (v && v.esempio) out += '<span class="badge demo">' + esc(t('common.demo')) + '</span>';
    if (v && v.verificato === false) out += '<span class="badge warn">' + esc(t('common.verify')) + '</span>';
    return out;
  }

  function telHref(n) {
    const d = String(n).replace(/[^\d+]/g, '');
    // Numeri italiani a 5+ cifre: +39 davanti, così chiamano anche da una SIM straniera. I brevi (112, 1530) restano così.
    return 'tel:' + (d.length > 4 && /^[03]/.test(d) ? '+39' + d : d);
  }

  function mapHref(coord, label) {
    const lat = coord[0], lon = coord[1];
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod|Macintosh/.test(ua) && 'ontouchend' in document) return 'https://maps.apple.com/?ll=' + lat + ',' + lon + '&q=' + encodeURIComponent(label || 'Positano');
    if (/Android/.test(ua)) return 'geo:' + lat + ',' + lon + '?q=' + lat + ',' + lon + '(' + encodeURIComponent(label || 'Positano') + ')';
    return 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=17/' + lat + '/' + lon;
  }

  function mailHref(addr, oggetto) {
    if (!oggetto) return 'mailto:' + addr;
    const body = t('chiamo.corpo');
    return 'mailto:' + addr + '?subject=' + encodeURIComponent(oggetto) + '&body=' + encodeURIComponent(body);
  }

  function updatedLine(data) {
    if (!data || !data.aggiornato) return '';
    return '<p class="updated">' + esc(t('common.updated')) + ' ' + esc(dateLabel(String(data.aggiornato).slice(0, 10), { year: 'numeric' })) + '</p>';
  }

  function reportLine(sectionId) {
    const meta = cache.meta || {};
    if (!meta.segnalazioni) return '';
    const url = meta.segnalazioni + '?title=' + encodeURIComponent('[' + sectionId + '] ');
    return '<p class="updated"><a href="' + esc(url) + '" rel="noopener">' + esc(t('common.report')) + '</a></p>';
  }

  function fonteLine(f) {
    if (!f) return '';
    return '<p class="src">' + esc(t('common.source')) + ': ' + (f.url ? '<a href="' + esc(f.url) + '" rel="noopener">' + esc(pick(f.nome) || f.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + '</a>' : esc(pick(f.nome))) +
      (f.data ? ' · ' + esc(dateLabel(f.data, { year: 'numeric', month: 'short' })) : '') +
      (f.consultata ? ' · ' + esc(t('common.checked')) + ' ' + esc(dateLabel(f.consultata, { year: 'numeric', month: 'short' })) : '') + '</p>';
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 2200);
  }

  function share(title, hash) {
    const url = location.origin + location.pathname + hash;
    if (navigator.share) { navigator.share({ title: title + ' · Positano.app', url: url }).catch(function () { /* annullato */ }); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast(t('common.copied')); });
  }

  function shareBtn(hash, title) {
    return '<button type="button" class="share-btn" data-share="' + esc(hash) + '" data-title="' + esc(title) + '" aria-label="' + esc(t('common.share')) + '">' + icon('share') + '</button>';
  }

  /* ---------- una scheda (SchedaApp) ---------- */
  function renderVoce(v, sectionId) {
    const id = v.id ? 'v-' + v.id : '';
    let h = '<article class="item"' + (id ? ' id="' + esc(id) + '"' : '') + '>';
    if (v.categoria) h += banda(v.categoria, t('cat.' + v.categoria));
    h += '<div class="item-head"><h3>' + esc(pick(v.nome)) + '</h3>' + badges(v) + (v.id && sectionId ? shareBtn('#' + sectionId + '/' + v.id, pick(v.nome)) : '') + '</div>';
    if (v.sottotitolo) h += '<p class="sub">' + esc(pick(v.sottotitolo)) + '</p>';
    if (v.periodo) {
      const on = O.inPeriod(v.periodo, today());
      h += '<p class="state ' + (on ? 'on' : 'off') + '">' + esc(t(on ? 'common.active' : 'common.inactive')) +
        (v.periodo.testo ? ' · ' + esc(pick(v.periodo.testo)) : '') + '</p>';
    }
    if (v.dettagli && v.dettagli.length) h += '<ul class="chips">' + v.dettagli.map(function (d) { return '<li>' + esc(pick(d)) + '</li>'; }).join('') + '</ul>';
    if (v.nota) h += '<p>' + esc(pick(v.nota)) + '</p>';
    if (v.punti && v.punti.length) h += '<ul class="bullets">' + v.punti.map(function (p) { return '<li>' + esc(pick(p)) + '</li>'; }).join('') + '</ul>';
    if (v.orari) h += '<p class="hours">' + icon('clock') + '<span>' + esc(pick(v.orari)) + '</span></p>';
    if (v.indirizzo) h += '<p class="addr">' + icon('pin') + '<span>' + esc(pick(v.indirizzo)) + '</span></p>';

    const acts = [];
    const tels = Array.isArray(v.tel) ? v.tel : (v.tel ? [{ n: v.tel }] : []);
    let primary = !v.web || v.telPrimo;
    tels.forEach(function (x, i) {
      const n = typeof x === 'string' ? x : x.n;
      const lab = typeof x === 'object' && x.label ? pick(x.label) + ' · ' : '';
      acts.push('<a class="act' + (i === 0 && primary && v.verificato !== false ? ' primary' : '') + '" href="' + esc(telHref(n)) + '">' + icon('phone') + '<span>' + esc(lab + n) + '</span></a>');
    });
    if (v.web) acts.unshift('<a class="act' + (!primary ? ' primary' : '') + '" href="' + esc(v.web) + '" rel="noopener">' + icon('link') + '<span>' + esc(pick(v.webLabel) || t('common.web')) + '</span></a>');
    if (v.link) acts.push('<a class="act" href="' + esc(v.link) + '">' + icon('chevron') + '<span>' + esc(t('common.vedi')) + '</span></a>');
    if (v.coord) acts.push('<a class="act" href="' + esc(mapHref(v.coord, pick(v.nome))) + '" rel="noopener">' + icon('pin') + '<span>' + esc(t('common.map')) + '</span></a>');
    if (v.email) acts.push('<a class="act" href="' + esc(mailHref(v.email, v.oggetto)) + '">' + icon('mail') + '<span>' + esc(v.oggetto ? t('common.scrivi') : v.email) + '</span></a>');
    if (v.pec) acts.push('<a class="act" href="mailto:' + esc(v.pec) + '">' + icon('mail') + '<span>' + esc(t('common.pec')) + '</span></a>');
    if (acts.length) h += '<div class="acts">' + acts.join('') + '</div>';
    if (v.oggetto && v.email) h += '<p class="src">' + esc(v.email) + '</p>';
    h += fonteLine(v.fonte);
    return h + '</article>';
  }

  function sectionHeader(s, data, sottotitolo) {
    let h = TABS.indexOf(s.id) === -1 ? '<a class="crumb" href="#tutto">' + icon('back') + '<span>' + esc(t('sec.tutto')) + '</span></a>' : '';
    h += '<header class="sec-head">' + banda(s.cat, t('cat.' + s.cat)) + '<h1 tabindex="-1">' + esc(t('sec.' + s.id)) + '</h1>';
    const intro = sottotitolo || (data && data.intro && pick(data.intro));
    if (intro) h += '<p>' + esc(intro) + '</p>';
    return h + '</header>';
  }

  function renderGroups(data, sectionId) {
    return (data.gruppi || []).map(function (g) {
      return '<section class="group"' + (g.id ? ' id="g-' + esc(g.id) + '"' : '') + '><h2 class="titolo-sez">' + esc(pick(g.titolo)) + '</h2>' +
        (g.nota ? '<p class="note" style="margin:-.3rem 0 .6rem">' + esc(pick(g.nota)) + '</p>' : '') +
        '<div class="list">' + (g.voci || []).map(function (v) { return renderVoce(v, sectionId); }).join('') + '</div></section>';
    }).join('');
  }

  function groupJump(data) {
    const gs = (data.gruppi || []).filter(function (g) { return g.id; });
    if (gs.length < 3) return '';
    return '<nav class="jump" aria-label="' + esc(t('a11y.onpage')) + '">' + gs.map(function (g) {
      return '<a href="#" data-jump="g-' + esc(g.id) + '">' + esc(pick(g.titolo)) + '</a>';
    }).join('') + '</nav>';
  }

  /* ---------- pagine generiche ---------- */
  function renderSection(s) {
    return loadJSON(s.file).then(function (data) {
      if (!data) return sectionHeader(s) + '<p class="note">' + esc(t('common.offline')) + '</p>';
      return sectionHeader(s, data) + groupJump(data) + renderGroups(data, s.id) + updatedLine(data) + reportLine(s.id);
    });
  }

  /* ---------- rifiuti ---------- */
  function wasteFor(data, iso) {
    const cal = data && data.calendario;
    if (!cal || !cal.sere) return null;
    return frazioni(data, cal.sere[String(O.weekday(iso))] || []);
  }
  function frazioni(data, ids) {
    return ids.map(function (id) { return Object.assign({ id: id }, (data.frazioni || {})[id] || { nome: id }); });
  }
  function fraz(f) {
    return '<span class="fraz fraz-' + esc(f.colore || 'grey') + '">' + esc(pick(f.nome)) + (f.verificato === false ? ' <span class="q" title="' + esc(t('common.verify')) + '">?</span>' : '') + '</span>';
  }

  function renderRifiuti() {
    const s = section('rifiuti');
    return loadJSON('rifiuti').then(function (data) {
      if (!data) return sectionHeader(s) + '<p class="note">' + esc(t('common.offline')) + '</p>';
      let h = sectionHeader(s, data);
      const cal = data.calendario;
      if (cal && cal.sere) {
        const iso = today();
        const tonight = wasteFor(data, iso);
        h += '<div class="panel-rif"><p class="note" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:.75rem">' + esc(t('home.waste.today')) + '</p>' +
          '<p style="font-size:1.05rem;font-weight:600">' + (tonight.length ? tonight.map(fraz).join(' ') : esc(t('home.waste.none'))) + '</p>' +
          (cal.esposizione ? '<p class="note">' + esc(pick(cal.esposizione)) + '</p>' : '') + '</div>';
        h += '<h2 class="titolo-sez">' + esc(t('rifiuti.week')) + '</h2><ol class="week">';
        for (let i = 0; i < 7; i++) {
          const d = O.addDays(iso, i);
          const fs = frazioni(data, cal.sere[String(O.weekday(d))] || []);
          h += '<li' + (i === 0 ? ' class="is-today"' : '') + '><span class="wd">' + esc(i === 0 ? t('rifiuti.tonight') : dateLabel(d, { weekday: 'short', day: 'numeric', month: undefined })) + '</span><span>' +
            (fs.length ? fs.map(fraz).join(' ') : '<span class="muted">' + esc(t('rifiuti.nothing')) + '</span>') + '</span></li>';
        }
        h += '</ol>';
        if (cal.nota) h += '<p class="note" style="margin-top:.5rem">' + esc(pick(cal.nota)) + '</p>';
        h += fonteLine(cal.fonte);
      }
      h += '<h2 class="titolo-sez">' + esc(t('rifiuti.glossario')) + '</h2>' +
        '<input type="search" id="rifiuti-search" class="field" placeholder="' + esc(t('rifiuti.search')) + '" aria-label="' + esc(t('rifiuti.search')) + '">' +
        '<div id="list-glossario" class="gloss"></div>';
      h += renderGroups(data, 'rifiuti') + updatedLine(data) + reportLine('rifiuti');
      return h;
    });
  }

  function fillGlossario() {
    const el = document.getElementById('list-glossario');
    const input = document.getElementById('rifiuti-search');
    const data = cache.rifiuti;
    if (!el || !data) return;
    const q = norm(input.value).trim();
    const fr = data.frazioni || {};
    const items = (data.glossario || []).filter(function (g) {
      return !q || norm(pick(g.voce) + ' ' + pick(g.dove) + ' ' + (g.cerca || '')).indexOf(q) !== -1;
    });
    el.innerHTML = items.length ? items.map(function (g) {
      const f = g.frazione && fr[g.frazione] ? fraz(fr[g.frazione]) + ' ' : '';
      const dove = g.frazione && fr[g.frazione] && pick(g.dove) === pick(fr[g.frazione].nome) ? '' : pick(g.dove);
      return '<div class="gloss-row"><strong>' + esc(pick(g.voce)) + '</strong><span>' + f + esc(dove) + '</span></div>';
    }).join('') : '<p class="note">' + esc(t('rifiuti.none')) + '</p>';
  }

  /* ---------- eventi ---------- */
  function upcomingEvents(data) {
    const iso = today();
    return (data && data.eventi || []).map(function (e) {
      const occ = O.nextOccurrence(e, iso);
      return occ ? Object.assign({}, e, { _da: occ.data, _a: occ.fine, _stimata: occ.stimata }) : null;
    }).filter(Boolean).sort(function (a, b) { return a._da.localeCompare(b._da); });
  }

  function eventRow(e) {
    const a = e._da.split('-');
    const range = e._a && e._a !== e._da ? ' – ' + dateLabel(e._a) : '';
    let h = '<article class="event" id="v-' + esc(e.id || '') + '"><div class="ev-date"><span class="d">' + Number(a[2]) + '</span><span class="m">' +
      esc(dateLabel(e._da, { day: undefined, month: 'short' })) + '</span></div><div class="ev-body">' +
      '<div class="item-head"><h3>' + esc(pick(e.titolo)) + '</h3>' + badges(e) + (e.id ? shareBtn('#eventi/' + e.id, pick(e.titolo)) : '') + '</div>' +
      '<p class="sub">' + esc(dateLabel(e._da, { weekday: 'long' })) + range + (e.orario ? ' · ' + esc(pick(e.orario)) : '') + ' · ' + esc(relDay(e._da)) + '</p>';
    if (e.luogo) h += '<p class="addr">' + icon('pin') + '<span>' + esc(pick(e.luogo)) + '</span></p>';
    if (e.nota) h += '<p>' + esc(pick(e.nota)) + '</p>';
    const acts = [];
    if (e.coord) acts.push('<a class="act" href="' + esc(mapHref(e.coord, pick(e.luogo))) + '" rel="noopener">' + icon('pin') + '<span>' + esc(t('common.map')) + '</span></a>');
    if (e.web) acts.push('<a class="act" href="' + esc(e.web) + '" rel="noopener">' + icon('link') + '<span>' + esc(t('common.web')) + '</span></a>');
    acts.push('<a class="act" href="' + esc(icsHref(e)) + '" download="' + esc((e.id || 'evento') + '.ics') + '">' + icon('calendar') + '<span>' + esc(t('eventi.calendario')) + '</span></a>');
    h += '<div class="acts">' + acts.join('') + '</div>';
    h += fonteLine(e.fonte);
    return h + '</div></article>';
  }

  /* «Aggiungi al calendario»: file .ics generato sul telefono, nessun servizio esterno. */
  function icsHref(e) {
    const d1 = e._da.replace(/-/g, ''), d2 = O.addDays(e._a || e._da, 1).replace(/-/g, '');
    const txt = function (s) { return String(s || '').replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n'); };
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Positano.app//IT', 'BEGIN:VEVENT', 'UID:' + (e.id || d1) + '@positano.app',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART;VALUE=DATE:' + d1, 'DTEND;VALUE=DATE:' + d2,
      'SUMMARY:' + txt(pick(e.titolo)), 'LOCATION:' + txt(pick(e.luogo) + ', Positano'), 'DESCRIPTION:' + txt(pick(e.nota)), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  function eventRowEstimated(e) {
    const range = e._a && e._a !== e._da ? dateLabel(e._da, { month: undefined }) + '-' + dateLabel(e._a) : dateLabel(e._da);
    return '<a class="menu-row" href="#eventi/' + esc(e.id || '') + '" id="v-' + esc(e.id || '') + '"><span class="menu-b" style="background:var(--c-cultura)"></span><span><strong>' + esc(pick(e.titolo)) + '</strong>' +
      '<small>' + esc(t('eventi.usually', { d: range })) + (e.luogo ? ' · ' + esc(pick(e.luogo)) : '') + '</small></span></a>';
  }

  function filtraEventi(list, f) {
    const iso = today(), dom = O.addDays(iso, 1);
    const wd = O.weekday(iso);
    const sab = O.addDays(iso, (6 - wd + 7) % 7), domenica = O.addDays(sab, 1);
    return list.filter(function (e) {
      const a = e._a || e._da;
      if (f === 'oggi') return e._da <= iso && a >= iso;
      if (f === 'domani') return e._da <= dom && a >= dom;
      if (f === 'weekend') return e._da <= domenica && a >= (wd === 0 ? iso : sab);
      return true;
    });
  }

  function renderEventi() {
    const s = section('eventi');
    return loadJSON('eventi').then(function (data) {
      if (!data) return sectionHeader(s) + '<p class="note">' + esc(t('common.offline')) + '</p>';
      const list = upcomingEvents(data);
      let h = sectionHeader(s, data);
      h += '<div class="filtri" role="group" aria-label="' + esc(t('eventi.quando')) + '">' + ['tutti', 'oggi', 'domani', 'weekend'].map(function (f) {
        return '<button type="button" class="filtro" data-filtro-eventi="' + f + '" aria-pressed="' + (stato.filtroEventi === f) + '">' + esc(t('eventi.f.' + f)) + '</button>';
      }).join('') + '</div>';
      const certi = filtraEventi(list.filter(function (e) { return !e._stimata; }), stato.filtroEventi);
      const stimati = list.filter(function (e) { return e._stimata; });
      if (!certi.length) h += '<p class="note">' + esc(t(stato.filtroEventi === 'tutti' ? 'eventi.none' : 'eventi.none.filtro')) + '</p>';
      let lastMonth = '';
      certi.forEach(function (e) {
        const m = e._da.slice(0, 7);
        if (m !== lastMonth) { h += '<h2 class="titolo-sez">' + esc(dateLabel(e._da, { day: undefined, month: 'long', year: 'numeric' })) + '</h2>'; lastMonth = m; }
        h += eventRow(e);
      });
      if (stimati.length && stato.filtroEventi === 'tutti') {
        h += '<h2 class="titolo-sez">' + esc(t('eventi.yearly')) + '</h2><p class="note" style="margin-bottom:.6rem">' + esc(t('eventi.yearly.note')) + '</p><div class="menu">' + stimati.map(eventRowEstimated).join('') + '</div>';
      }
      return h + updatedLine(data) + reportLine('eventi');
    });
  }

  /* ---------- avvisi ---------- */
  function tuttiAvvisi() {
    return Promise.all([loadJSON('avvisi'), loadAPI(), loadJSON('avvisi-comune')]).then(function (r) {
      const statici = (r[0] && r[0].avvisi || []).map(function (a) { return Object.assign({ categoria: a.livello === 'attenzione' ? 'emergenze' : 'istituzionale', stato: 'attivo' }, a); });
      const dinamici = r[1] && r[1].avvisi || [];
      return { avvisi: dinamici.concat(statici), comune: r[2] && r[2].avvisi || [] };
    });
  }
  function avvisiAttivi(list, iso) {
    return list.filter(function (a) { return a.dal <= iso && a.al >= iso && a.stato !== 'risolto'; })
      .sort(function (a, b) { return (b.priorita || 0) - (a.priorita || 0) || (a.categoria === 'emergenze' ? -1 : 0) - (b.categoria === 'emergenze' ? -1 : 0) || String(b.dal).localeCompare(String(a.dal)); });
  }
  function validita(a, iso) {
    if (a.dal === a.al) return a.dal === iso ? t('common.today') : dateLabel(a.dal);
    return t('avvisi.fino', { d: a.al === iso ? t('common.today') : dateLabel(a.al) });
  }
  function avvisoCard(a, iso) {
    let h = '<article class="avviso" id="v-' + esc(a.id) + '"><div class="occhiello" style="' + catStyle(a.categoria) + '"><span>' + esc(t('cat.' + a.categoria)) + '</span><span>' + esc(validita(a, iso)) + '</span></div><div class="filo"></div><div class="corpo">';
    h += '<div class="item-head" style="padding-right:44px"><h3>' + esc(pick(a.titolo)) + '</h3>' + badges(a) + shareBtn('#avvisi/' + a.id, pick(a.titolo)) + '</div>';
    if (a.stato && a.stato !== 'attivo') h += '<span class="stato ' + esc(a.stato) + '" style="align-self:flex-start">' + esc(t('avvisi.stato.' + a.stato)) + '</span>';
    if (pick(a.testo)) h += '<p>' + esc(pick(a.testo)) + '</p>';
    if (a.aggiornamenti && a.aggiornamenti.length) {
      h += '<ol class="storia">' + a.aggiornamenti.slice().reverse().map(function (u) {
        return '<li><b>' + esc(dateLabel(String(u.quando).slice(0, 10), { month: 'short' })) + '</b> · ' + esc(u.testo) + '</li>';
      }).join('') + '</ol>';
    }
    h += fonteLine(a.fonte);
    return h + '</div></article>';
  }
  function comuneLink(c) {
    return '<a class="comune-link" href="' + esc(c.link) + '" rel="noopener"><span class="menu-b" style="background:var(--c-istituzionale);align-self:stretch;width:4px"></span><span><strong>' + esc(pick(c.titolo)) + '</strong><small>' + esc(t('avvisi.dalcomune')) + ' · ' + esc(dateLabel(c.data, { month: 'short' })) + '</small></span>' + icon('link', 'chev') + '</a>';
  }

  function renderAvvisi() {
    const s = section('avvisi');
    return tuttiAvvisi().then(function (r) {
      const iso = today();
      const attivi = avvisiAttivi(r.avvisi, iso);
      const recenti = r.avvisi.filter(function (a) { return attivi.indexOf(a) === -1 && a.al >= O.addDays(iso, -30) && a.dal <= iso; });
      let h = sectionHeader(s, null, t('avvisi.intro'));
      h += '<h2 class="titolo-sez">' + esc(t('avvisi.incorso')) + '</h2><div class="avvisi">' + (attivi.length ? attivi.map(function (a) { return avvisoCard(a, iso); }).join('') : '<p class="note">' + esc(t('avvisi.nessuno')) + '</p>') + '</div>';
      if (r.comune.length) h += '<h2 class="titolo-sez">' + esc(t('avvisi.sito')) + '</h2><div class="avvisi">' + r.comune.slice(0, 12).map(comuneLink).join('') + '</div>';
      if (recenti.length) h += '<h2 class="titolo-sez">' + esc(t('avvisi.conclusi')) + '</h2><div class="avvisi">' + recenti.map(function (a) { return avvisoCard(a, iso); }).join('') + '</div>';
      return h + reportLine('avvisi');
    });
  }

  /* ---------- aperti d'inverno ---------- */
  function apertoIl(l, iso) {
    const wd = O.weekday(iso);
    return (l.periodi || []).some(function (p) { return p.dal <= iso && p.al >= iso && (!p.giorni || p.giorni.indexOf(wd) !== -1); });
  }
  const GIORNI = { it: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
  function periodoTesto(p) {
    const stessoMese = p.dal.slice(0, 7) === p.al.slice(0, 7);
    let s = (stessoMese ? String(Number(p.dal.slice(8))) : dateLabel(p.dal, { month: 'short' })) + '-' + dateLabel(p.al, { month: 'short' });
    if (p.giorni && p.giorni.length) s += ' (' + p.giorni.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (g) { return GIORNI[getLang()][g]; }).join(', ') + ')';
    if (p.nota) s += ' · ' + p.nota;
    return s;
  }

  function renderInverno() {
    const s = section('inverno');
    return loadAPI().then(function (api) {
      const ap = api && api.aperture;
      const st = ap && ap.stagione;
      let h = sectionHeader(s, null, st && pick(st.nota) || t('inverno.intro'));
      if (!ap) return h + '<p class="note">' + esc(t('common.offline')) + '</p>';
      const iso = today();
      const locali = ap.locali || [];
      if (!locali.length) {
        return h + '<div class="vuoto"><strong>' + esc(t('inverno.vuoto.t')) + '</strong><p class="note">' + esc(t('inverno.vuoto')) + '</p><a class="more" href="#comune/turismo">' + esc(t('inverno.contatti')) + ' ' + icon('chevron') + '</a></div>';
      }
      const cats = locali.map(function (l) { return l.categoria; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
      const aperti = locali.filter(function (l) { return apertoIl(l, iso); });
      h += '<div class="pannello" style="margin-top:0"><span class="ic-big" style="' + catStyle('oggi') + '">' + icon('snow') + '</span><span><span class="k">' + esc(t('inverno.oggi')) + '</span><span class="v">' +
        esc(t('inverno.aperti', { n: aperti.length, tot: locali.length })) + '</span></span></div>';
      h += '<div class="filtri" role="group" style="margin-top:.9rem">' + ['tutti'].concat(cats).map(function (c) {
        return '<button type="button" class="filtro" data-filtro-inverno="' + esc(c) + '" aria-pressed="' + (stato.filtroInverno === c) + '">' + esc(c === 'tutti' ? t('inverno.tutti') : t('locale.' + c)) + '</button>';
      }).join('') + '<button type="button" class="filtro" data-solo-aperti aria-pressed="' + stato.soloAperti + '">' + esc(t('inverno.soloaperti')) + '</button></div>';

      const dal = st.dal, al = st.al, tot = O.daysBetween(dal, al) + 1;
      const pos = function (d) { return Math.max(0, Math.min(100, O.daysBetween(dal, d) / tot * 100)); };
      // intestazione dei mesi
      let mesi = '';
      let d = dal.slice(0, 8) + '01';
      while (d <= al) {
        const left = pos(d < dal ? dal : d);
        mesi += '<span style="left:' + left.toFixed(2) + '%">' + esc(dateLabel(d < dal ? dal : d, { day: undefined, month: 'short' })) + '</span>';
        const y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7));
        d = (m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0')) + '-01';
      }
      const visibili = locali.filter(function (l) { return (stato.filtroInverno === 'tutti' || l.categoria === stato.filtroInverno) && (!stato.soloAperti || apertoIl(l, iso)); });
      h += '<p class="tl-legenda"><span><i style="background:var(--c-extra)"></i>' + esc(t('inverno.leg.aperto')) + '</span><span><i style="background:repeating-linear-gradient(90deg,var(--c-extra) 0 4px,#7FA6BF 4px 6px)"></i>' + esc(t('inverno.leg.giorni')) + '</span><span><i style="background:var(--filo);width:3px"></i>' + esc(t('common.today')) + '</span></p>';
      h += '<div class="tl"><div class="tl-mesi" aria-hidden="true">' + mesi + '</div>';
      // Ordinati per zona, come nel calendario del Comune; dentro ogni zona in ordine alfabetico.
      const ordineZone = (st.zone || []).slice();
      visibili.forEach(function (l) { const z = l.zona || t('inverno.altrezone'); if (ordineZone.indexOf(z) === -1) ordineZone.push(z); });
      const perZona = ordineZone.map(function (z) {
        return { zona: z, locali: visibili.filter(function (l) { return (l.zona || t('inverno.altrezone')) === z; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); }) };
      }).filter(function (g) { return g.locali.length; });
      h += perZona.length ? perZona.map(function (g) {
        return '<div class="tl-zona">' + esc(g.zona) + '</div>' + g.locali.map(function (l) {
          const oggi = apertoIl(l, iso);
          let r = '<div class="tl-riga" id="v-l' + l.id + '"><div class="tl-nome"><strong>' + esc(l.nome) + '</strong><small>' + esc(t('locale.' + l.categoria)) + '</small>' + (oggi ? '<span class="tl-oggi">' + esc(t('inverno.apertooggi')) + '</span>' : '') + '</div>';
          r += '<div class="tl-barra" aria-hidden="true">' + (l.periodi || []).map(function (p) {
            const a = pos(p.dal), b = pos(O.addDays(p.al, 1));
            return '<b class="' + (p.giorni ? 'giorni' : '') + '" style="left:' + a.toFixed(2) + '%;width:' + Math.max(0.6, b - a).toFixed(2) + '%"></b>';
          }).join('') + (iso >= dal && iso <= al ? '<span class="ora" style="left:' + pos(iso).toFixed(2) + '%"></span>' : '') + '</div>';
          r += '<div class="tl-periodi">' + esc((l.periodi || []).map(periodoTesto).join(' · ') || t('inverno.nessunadata')) + '</div>';
          if (l.nota || l.telefono || l.indirizzo) r += '<div class="tl-periodi">' + esc([l.indirizzo, l.nota].filter(Boolean).join(' · ')) + (l.telefono ? ' · <a href="' + esc(telHref(l.telefono)) + '">' + esc(l.telefono) + '</a>' : '') + '</div>';
          return r + '</div>';
        }).join('');
      }).join('') : '<div class="tl-riga"><span class="note">' + esc(t('inverno.nessuno')) + '</span></div>';
      h += '</div>';
      h += '<p class="note" style="margin-top:.8rem">' + esc(t('inverno.parita')) + '</p>';
      if (st.aggiornato) h += '<p class="updated">' + esc(t('common.updated')) + ' ' + esc(dateLabel(st.aggiornato, { year: 'numeric' })) + '</p>';
      return h;
    });
  }

  /* ---------- home a modalità ---------- */
  const METEO = { 0: 'sereno', 1: 'sereno', 2: 'nuvoloso', 3: 'coperto', 45: 'nebbia', 48: 'nebbia', 51: 'pioviggine', 53: 'pioviggine', 55: 'pioviggine', 61: 'pioggia', 63: 'pioggia', 65: 'pioggiaforte', 66: 'pioggia', 67: 'pioggia', 71: 'neve', 73: 'neve', 75: 'neve', 80: 'rovesci', 81: 'rovesci', 82: 'pioggiaforte', 95: 'temporale', 96: 'temporale', 99: 'temporale' };
  function meteoTesto(code) { return t('meteo.' + (METEO[code] || 'nuvoloso')); }

  function hello() {
    const m = O.minutesRome();
    return t(m < 13 * 60 ? 'home.hello.morning' : m < 18 * 60 ? 'home.hello.afternoon' : 'home.hello.evening');
  }

  function livelloOggi(allerta, iso) {
    const g = allerta && allerta.giorni && allerta.giorni[iso];
    return g ? g : null;
  }

  function scegliModo(home, cfg, allerta, iso, anteprima) {
    const modi = home && home.modalita || [];
    const byId = function (id) { return modi.find(function (m) { return m.id === id; }); };
    if (anteprima && byId(anteprima)) return { modo: byId(anteprima), perche: 'anteprima' };
    if (cfg && cfg.forzata && byId(cfg.forzata)) return { modo: byId(cfg.forzata), perche: 'forzata' };
    const lv = livelloOggi(allerta, iso);
    if (lv && (lv.complessivo === 'arancione' || lv.complessivo === 'rosso') && byId('allerta')) return { modo: byId('allerta'), perche: 'allerta' };
    for (const m of modi) {
      if (m.automatica) continue;
      if (m.date && m.date.some(function (p) { return O.inPeriod(p, iso); })) return { modo: m, perche: 'data' };
      if (m.periodo && O.inPeriod(m.periodo, iso)) return { modo: m, perche: 'data' };
    }
    return { modo: byId('ordinaria') || { id: 'ordinaria', blocchi: ['sos', 'avvisi', 'sezioni'] }, perche: 'data' };
  }

  function bloccoAllerta(allerta, iso, grande) {
    const g = livelloOggi(allerta, iso);
    if (!g) return '';
    if (g.complessivo === 'verde') {
      return '<div class="allerta-ok"><span class="pallino"></span><span>' + esc(t('allerta.nessuna')) + '</span></div>';
    }
    const rischi = ['idrogeologico', 'idraulico', 'temporali'].filter(function (k) { return g[k] && g[k] !== 'verde'; }).map(function (k) { return t('allerta.r.' + k) + ': ' + t('allerta.l.' + g[k]); });
    return '<section class="allerta ' + esc(g.complessivo) + '"><div class="fascia"><span>' + esc(t('allerta.titolo')) + '</span><span>' + esc(t('common.today')) + '</span></div><div class="corpo">' +
      '<h2>' + esc(t('allerta.l.' + g.complessivo)) + '</h2><p>' + esc(rischi.join(' · ')) + '</p>' +
      (grande ? '<ul class="bullets">' + ['allerta.c1', 'allerta.c2', 'allerta.c3', 'allerta.c4'].map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join('') + '</ul>' : '<p class="note">' + esc(t('allerta.cosa')) + '</p>') +
      '<p class="src">' + esc(t('common.source')) + ': <a href="' + esc(allerta.fonte.url) + '" rel="noopener">' + esc(allerta.fonte.nome) + '</a> · ' + esc(g.zona) + '</p></div></section>';
  }

  function blocco(id, ctx) {
    const iso = ctx.iso;
    switch (id) {
      case 'sos':
        return '<a class="sos" href="tel:112">' + icon('phone') + '<span><strong>' + esc(t('home.sos')) + '</strong><small>' + esc(t('home.sos.sub')) + '</small></span></a>';
      case 'allerta':
        return bloccoAllerta(ctx.allerta, iso, ctx.modo.id === 'allerta');
      case 'avvisi': {
        const att = avvisiAttivi(ctx.avvisi.avvisi, iso);
        const com = ctx.avvisi.comune.filter(function (c) { return c.data >= O.addDays(iso, -7); }).slice(0, 2);
        if (!att.length && !com.length) return '';
        return '<h2 class="titolo-sez">' + esc(t('home.alerts')) + '</h2><div class="avvisi">' + att.slice(0, 3).map(function (a) { return avvisoCard(a, iso); }).join('') + com.map(comuneLink).join('') + '</div>' +
          '<p><a class="more" href="#avvisi">' + esc(t('home.avvisi.tutti')) + ' ' + icon('chevron') + '</a></p>';
      }
      case 'rifiuti': {
        const tonight = wasteFor(ctx.rifiuti, iso);
        if (!tonight) return '';
        return '<a class="pannello" href="#rifiuti"><span class="ic-big" style="' + catStyle('ambiente') + '">' + icon('recycle') + '</span><span><span class="k">' + esc(t('home.waste.today')) + '</span>' +
          '<span class="v">' + (tonight.length ? tonight.map(fraz).join(' ') : esc(t('home.waste.none'))) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      }
      case 'partenze':
        return targheBox(ctx.trasporti, iso) + departuresBox(ctx.trasporti, iso);
      case 'regole': {
        const reg = (ctx.regole && ctx.regole.gruppi || []).reduce(function (a, g) { return a.concat(g.voci || []); }, []).filter(function (v) { return v.inHome !== false && v.periodo && O.inPeriod(v.periodo, iso); });
        if (!reg.length) return '';
        return '<h2 class="titolo-sez">' + esc(t('home.regole')) + '</h2><div class="menu">' + reg.map(function (v) {
          return '<a class="menu-row" href="#regole/' + esc(v.id) + '"><span class="menu-b" style="background:var(--c-' + esc(v.categoria || 'lavori') + ')"></span><span><strong>' + esc(pick(v.nome)) + '</strong><small>' + esc(pick(v.nota)) + '</small></span>' + icon('chevron', 'chev') + '</a>';
        }).join('') + '</div>';
      }
      case 'eventi': {
        const evs = upcomingEvents(ctx.eventi).filter(function (e) { return !e._stimata; }).slice(0, 3);
        if (!evs.length) return '';
        return '<h2 class="titolo-sez">' + esc(t('home.events')) + '</h2>' + evs.map(eventRow).join('') + '<p><a class="more" href="#eventi">' + esc(t('home.events.all')) + ' ' + icon('chevron') + '</a></p>';
      }
      case 'servizi':
        return '<h2 class="titolo-sez">' + esc(t('home.servizi')) + '</h2><div class="scorciatoie">' +
          scorciatoia('#servizi/appuntamento', 'calendar', t('sc.prenota')) + scorciatoia('#servizi/pagopa', 'pagare', t('sc.paga')) + scorciatoia('#servizi/certificati', 'townhall', t('sc.certificati')) +
          scorciatoia('#chiamo', 'help', t('sc.chiamo')) + scorciatoia('#servizi/sue', 'home', t('sc.casa')) + scorciatoia('#servizi', 'grid', t('sc.tutti')) + '</div>';
      case 'inverno': {
        const ap = ctx.api && ctx.api.aperture;
        if (!ap) return '';
        const loc = ap.locali || [];
        const n = loc.filter(function (l) { return apertoIl(l, iso); }).length;
        return '<a class="pannello" href="#inverno"><span class="ic-big" style="' + catStyle('extra') + '">' + icon('snow') + '</span><span><span class="k">' + esc(pick(ap.stagione && ap.stagione.titolo) || t('sec.inverno')) + '</span><span class="v">' +
          esc(loc.length ? t('inverno.aperti', { n: n, tot: loc.length }) : t('inverno.vuoto.home')) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      }
      case 'mare': {
        const m = ctx.meteo && ctx.meteo.mare;
        return '<a class="pannello" href="#mare"><span class="ic-big" style="' + catStyle('turismo') + '">' + icon('beach') + '</span><span><span class="k">' + esc(t('home.mare')) + '</span><span class="v">' +
          esc(m ? t('home.mare.v', { onde: String(m.onde).replace('.', ','), acqua: Math.round(m.acqua) }) : t('desc.mare')) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      }
      case 'protezione':
        return '<a class="pannello" href="#emergenze/aree-attesa"><span class="ic-big" style="' + catStyle('protezione-civile') + '">' + icon('scudo') + '</span><span><span class="k">' + esc(t('home.protezione')) + '</span><span class="v">' + esc(t('home.protezione.v')) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      case 'chiamo':
        return '<a class="pannello" href="#chiamo"><span class="ic-big" style="' + catStyle('istituzionale') + '">' + icon('help') + '</span><span><span class="k">' + esc(t('sec.chiamo')) + '</span><span class="v">' + esc(t('desc.chiamo')) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      case 'sezioni':
        return '<h2 class="titolo-sez">' + esc(t('home.sections')) + '</h2><div class="tiles">' + SECTIONS.filter(function (s) { return !s.nascosta && s.id !== 'info' && s.id !== 'avvisi'; }).map(tile).join('') + '</div>';
    }
    return '';
  }
  function scorciatoia(href, ic, label) { return '<a class="scorciatoia" href="' + esc(href) + '">' + icon(ic) + '<span>' + esc(label) + '</span></a>'; }

  function tile(s) {
    return '<a class="tile" href="#' + s.id + '"><span class="tile-b" style="background:var(--c-' + s.cat + ')"></span><span class="tile-in">' + icon(s.icon) +
      '<span class="tile-t">' + esc(t('sec.' + s.id)) + '</span><span class="tile-d">' + esc(t('desc.' + s.id)) + '</span></span></a>';
  }

  function renderHome(anteprima) {
    return Promise.all(['meta', 'rifiuti', 'eventi', 'trasporti', 'home', 'regole', 'allerta', 'meteo'].map(loadJSON).concat([loadAPI(), tuttiAvvisi()])).then(function (r) {
      const ctx = { meta: r[0], rifiuti: r[1], eventi: r[2], trasporti: r[3], home: r[4], regole: r[5], allerta: r[6], meteo: r[7], api: r[8], avvisi: r[9], iso: today() };
      const cfg = ctx.api && ctx.api.home;
      const scelta = scegliModo(ctx.home, cfg, ctx.allerta, ctx.iso, anteprima);
      ctx.modo = scelta.modo;
      const sun = O.sunTimes(ctx.iso);
      let h = '<section class="hero"><p class="hero-k">' + esc(hello()) + '</p><h1 tabindex="-1">' + esc(dateLabel(ctx.iso, { weekday: 'long' })) + '</h1><p class="hero-riga">';
      if (ctx.meteo && ctx.meteo.ora) h += '<span class="meteo">' + Math.round(ctx.meteo.ora.temperatura) + '° · ' + esc(meteoTesto(ctx.meteo.ora.codice)) + '</span>';
      if (sun) h += '<span>' + icon('sun') + esc(t('home.sunrise')) + ' ' + esc(O.formatTime(sun.alba, getLang())) + '</span><span>' + icon('sunset') + esc(t('home.sunset')) + ' ' + esc(O.formatTime(sun.tramonto, getLang())) + '</span>';
      h += '</p><p class="modo"><i style="background:var(--c-' + esc(ctx.modo.colore || 'istituzionale') + ')"></i>' + esc(t('home.modo', { m: pick(ctx.modo.nome) })) + (scelta.perche === 'anteprima' ? ' · ' + esc(t('home.anteprima')) + ' · <a href="#home">' + esc(t('home.esci')) + '</a>' : '') + '</p></section>';
      if (cfg && cfg.messaggio && pick(cfg.messaggio)) {
        h += '<div class="messaggio"><div class="fascia" style="' + catStyle(ctx.modo.colore) + '">' + esc(t('home.messaggio')) + '</div><div class="filo" style="height:3px;background:var(--filo)"></div><p>' + esc(pick(cfg.messaggio)) + '</p></div>';
      }
      (ctx.modo.blocchi || []).forEach(function (b) { h += blocco(b, ctx); });
      h += installBox();
      return h;
    });
  }

  /* Targhe alterne: nei giorni pari non circolano le targhe pari, nei dispari le dispari. */
  function targheBox(tr, iso) {
    const ta = tr && tr.targhe;
    if (!ta || (ta.giorni || []).indexOf(iso) === -1) return '';
    const pari = Number(iso.slice(8)) % 2 === 0;
    return '<a class="pannello" href="#muoversi/targhe-alterne"><span class="ic-big" style="' + catStyle('viabilita') + '">' + icon('car') + '</span><span><span class="k">' + esc(t('home.plates.title')) + '</span><span class="v">' +
      esc(t(pari ? 'home.plates.even' : 'home.plates.odd', { h: ta.orario })) + '</span></span></a>';
  }

  /* Prossime partenze di oggi, calcolate sull'ora di Positano. */
  function departuresBox(tr, iso) {
    const now = O.minutesRome();
    const rows = (tr && tr.partenze || []).filter(function (p) { return O.inPeriod({ dal: p.dal, al: p.al }, iso); }).map(function (p) {
      const next = (p.orari || []).filter(function (o) { const a = o.split(':'); return Number(a[0]) * 60 + Number(a[1]) >= now; });
      if (!next.length) return null;
      const list = p.soloUltima ? next.slice(0, 1) : next.slice(0, 3);
      return { at: next[0], html: '<a class="menu-row" href="' + esc(p.link || '#muoversi') + '"><span class="menu-b" style="background:var(--c-viabilita)"></span><span><strong>' + esc(pick(p.nome)) + '</strong>' +
        '<small>' + esc(pick(p.da)) + '</small></span><span style="display:flex;gap:.4rem;font-variant-numeric:tabular-nums">' + list.map(function (o, i) { return '<b style="' + (i ? 'font-weight:500;color:var(--ink2)' : 'font-size:1.05rem') + '">' + esc(o) + '</b>'; }).join('') + '</span></a>' };
    }).filter(Boolean).sort(function (a, b) { return a.at.localeCompare(b.at); }).slice(0, 4).map(function (r) { return r.html; });
    if (!rows.length) return '';
    return '<h2 class="titolo-sez">' + esc(t('home.departures')) + '</h2><div class="menu">' + rows.join('') + '</div>';
  }

  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }

  function installBox() {
    let dismissed = false;
    try { dismissed = localStorage.getItem('installDismissed') === '1'; } catch (e) { /* ignora */ }
    if (dismissed || isStandalone()) return '';
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return '<div class="install" id="install-box"><div><strong>' + esc(t('install.title')) + '</strong><p>' + esc(t(ios ? 'install.ios' : 'install.android')) + '</p>' +
      (deferredInstall ? '<button type="button" class="btn" id="install-go">' + esc(t('install.btn')) + '</button>' : '') + '</div>' +
      '<button type="button" class="icon-btn" id="install-dismiss" aria-label="' + esc(t('common.close')) + '">' + icon('close') + '</button></div>';
  }

  function renderTutto() {
    return Promise.resolve('<header class="sec-head"><h1 tabindex="-1">' + esc(t('sec.tutto')) + '</h1></header><div class="menu">' +
      SECTIONS.filter(function (s) { return !s.nascosta; }).map(function (s) {
        return '<a class="menu-row" href="#' + s.id + '"><span class="menu-b" style="background:var(--c-' + s.cat + ')"></span><span><strong>' + esc(t('sec.' + s.id)) + '</strong><small>' + esc(t('desc.' + s.id)) + '</small></span>' + icon('chevron', 'chev') + '</a>';
      }).join('') + '</div>');
  }

  function renderInfo() {
    const s = section('info');
    return Promise.all([loadJSON('meta'), loadJSON('home')]).then(function (r) {
      const meta = r[0] || {}, home = r[1];
      let h = sectionHeader(s);
      h += '<div class="prose"><p>' + esc(t('info.text')) + '</p><p>' + esc(t('info.neutral')) + '</p>' +
        '<p class="callout">' + esc(t('info.ai')) + '</p>';
      if (home) {
        h += '<h2>' + esc(t('info.modi.title')) + '</h2><p>' + esc(pick(home.nota)) + '</p><div class="modi">' + home.modalita.map(function (m) {
          return '<a class="modo-card" href="#home/' + esc(m.id) + '"><span class="fascia" style="' + catStyle(m.colore) + '">' + esc(pick(m.nome)) + '</span><p>' + esc(pick(m.descrizione)) + '</p></a>';
        }).join('') + '</div>';
      }
      h += '<h2>' + esc(t('info.legale.title')) + '</h2><ul>' + ['info.l1', 'info.l2', 'info.l3', 'info.l4', 'info.l5'].map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join('') + '</ul>' +
        '<h2>' + esc(t('info.privacy.title')) + '</h2><p>' + esc(t('info.privacy')) + '</p>' +
        '<h2>' + esc(t('info.access.title')) + '</h2><p>' + esc(t('info.access')) + '</p>' +
        '<h2>' + esc(t('info.offline.title')) + '</h2><p>' + esc(t('info.offline')) + '</p>' +
        '<h2>' + esc(t('install.title')) + '</h2><p>' + esc(t('install.ios')) + '</p><p>' + esc(t('install.android')) + '</p>' +
        '<h2>' + esc(t('info.strumenti.title')) + '</h2><div class="acts"><a class="act" href="#post">' + icon('immagine') + '<span>' + esc(t('sec.post')) + '</span></a><a class="act" href="admin.html">' + icon('grid') + '<span>' + esc(t('info.redazione')) + '</span></a></div>' +
        '<h2>' + esc(t('info.contribute.title')) + '</h2><p>' + esc(t('info.contribute')) + '</p>' +
        '<p class="note">' + esc(t('info.version')) + ' ' + esc(meta.versione || '') + ' · <a href="' + esc(meta.repo || '#') + '" rel="noopener">' + esc(t('info.code')) + '</a></p></div>';
      return h + reportLine('info');
    });
  }

  /* ---------- ricerca globale ---------- */
  let index = null;
  function buildIndex() {
    return Promise.all(ALL_FILES.map(loadJSON).concat([loadAPI(), tuttiAvvisi()])).then(function (r) {
      const out = [];
      const add = function (sec, id, title, text) { out.push({ sec: sec, id: id, title: title, text: text }); };
      SECTIONS.forEach(function (s) {
        const d = s.file && cache[s.file];
        if (!d) return;
        (d.gruppi || []).forEach(function (g) {
          (g.voci || []).forEach(function (v) {
            add(s.id, v.id, v.nome, [v.nome, v.sottotitolo, v.nota, g.titolo, v.cerca, v.tel, v.indirizzo].concat(v.dettagli || [], v.punti || []));
          });
        });
        if (s.id === 'eventi') (d.eventi || []).forEach(function (e) { add('eventi', e.id, e.titolo, [e.titolo, e.luogo, e.nota, e.cerca]); });
        if (s.id === 'rifiuti') (d.glossario || []).forEach(function (g) { add('rifiuti', null, g.voce, [g.voce, g.dove, g.cerca]); });
      });
      const api = r[r.length - 2], av = r[r.length - 1];
      if (api && api.aperture) (api.aperture.locali || []).forEach(function (l) { add('inverno', 'l' + l.id, l.nome, [l.nome, l.zona, l.nota, t('locale.' + l.categoria), 'aperto inverno open winter']); });
      (av.avvisi || []).forEach(function (a) { add('avvisi', a.id, a.titolo, [a.titolo, a.testo]); });
      index = out;
      return out;
    });
  }
  function flat(x) {
    if (x == null) return '';
    if (Array.isArray(x)) return x.map(flat).join(' ');
    if (typeof x === 'object') return [x.it, x.en, x.n].filter(Boolean).join(' ');
    return String(x);
  }
  function doSearch(q) {
    const box = document.getElementById('search-results');
    const nq = norm(q).trim();
    if (!nq) { box.innerHTML = '<p class="note">' + esc(t('search.hint')) + '</p>'; return; }
    // Radice grezza: «bottiglia» trova anche «bottiglie», «spiagge» anche «spiaggia».
    const words = nq.split(/\s+/).filter(function (w) { return w.length > 1; }).map(function (w) { return w.length > 4 ? w.slice(0, -1) : w; });
    const hits = (index || []).map(function (e) {
      const title = norm(flat(e.title)), text = norm(flat(e.text));
      let score = 0;
      for (const w of words) {
        if (title.indexOf(w) !== -1) score += 3; else if (text.indexOf(w) !== -1) score += 1; else return null;
      }
      return { e: e, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 30);
    box.innerHTML = hits.length ? hits.map(function (h) {
      const s = section(h.e.sec);
      const href = '#' + h.e.sec + (h.e.id ? '/' + h.e.id : '');
      return '<a class="menu-row" href="' + esc(href) + '"><span class="menu-b" style="background:var(--c-' + s.cat + ')"></span><span><strong>' + esc(pick(h.e.title)) + '</strong><small>' + esc(t('sec.' + s.id)) + '</small></span>' + icon('chevron', 'chev') + '</a>';
    }).join('') : '<p class="note">' + esc(t('search.none')) + '</p>';
  }
  function openSearch() {
    const sh = document.getElementById('search');
    sh.hidden = false;
    document.body.classList.add('no-scroll');
    const input = document.getElementById('search-input');
    input.value = '';
    doSearch('');
    input.focus();
    if (!index) buildIndex().then(function () { doSearch(input.value); });
  }
  function closeSearch() {
    document.getElementById('search').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  /* ---------- router ---------- */
  function parseHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
    const parts = raw.split('/');
    return { page: parts[0] || 'home', item: parts.slice(1).join('/') || null };
  }

  function route() {
    closeSearch();
    const r = parseHash();
    let page = r.page;
    if (page === 'trasporti') page = 'muoversi'; // vecchi link della v0.1
    const known = page === 'home' || page === 'tutto' || section(page);
    if (!known) page = 'home';
    const tab = TABS.indexOf(page) !== -1 ? page : 'tutto';
    document.querySelectorAll('.bottomnav a').forEach(function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    let p;
    if (page === 'home') p = renderHome(r.item);
    else if (page === 'tutto') p = renderTutto();
    else if (page === 'rifiuti') p = renderRifiuti();
    else if (page === 'eventi') p = renderEventi();
    else if (page === 'avvisi') p = renderAvvisi();
    else if (page === 'inverno') p = renderInverno();
    else if (page === 'info') p = renderInfo();
    else if (page === 'post') p = window.PA_POST ? window.PA_POST.render(API, r.item) : Promise.resolve('');
    else p = renderSection(section(page));
    return p.then(function (html) {
      view.innerHTML = html;
      document.title = (page === 'home' ? 'Positano.app · ' + t('app.tagline') : t('sec.' + page) + ' · Positano.app');
      if (page === 'rifiuti') fillGlossario();
      if (page === 'post' && window.PA_POST) window.PA_POST.init(API, r.item);
      const target = r.item && page !== 'home' && page !== 'post' && (document.getElementById('v-' + r.item) || document.getElementById(r.item));
      if (target) {
        target.classList.add('flash');
        target.scrollIntoView({ block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      } else {
        window.scrollTo(0, 0);
        if (!firstRender) { const h1 = view.querySelector('h1'); if (h1) h1.focus({ preventScroll: true }); }
      }
      firstRender = false;
    });
  }

  /* Funzioni condivise con gli altri moduli (crea post). */
  const API = { esc: esc, pick: pick, icon: icon, t: t, loadJSON: loadJSON, tuttiAvvisi: tuttiAvvisi, avvisiAttivi: avvisiAttivi, today: today, dateLabel: dateLabel, sectionHeader: function (id) { return sectionHeader(section(id)); }, toast: toast };

  /* ---------- eventi UI ---------- */
  document.addEventListener('click', function (ev) {
    const sh = ev.target.closest('[data-share]');
    if (sh) { share(sh.getAttribute('data-title'), sh.getAttribute('data-share')); return; }
    const jump = ev.target.closest('[data-jump]');
    if (jump) {
      ev.preventDefault();
      const el = document.getElementById(jump.getAttribute('data-jump'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const fe = ev.target.closest('[data-filtro-eventi]');
    if (fe) { stato.filtroEventi = fe.getAttribute('data-filtro-eventi'); route(); return; }
    const fi = ev.target.closest('[data-filtro-inverno]');
    if (fi) { stato.filtroInverno = fi.getAttribute('data-filtro-inverno'); route(); return; }
    if (ev.target.closest('[data-solo-aperti]')) { stato.soloAperti = !stato.soloAperti; route(); return; }
    if (ev.target.closest('#install-dismiss')) {
      try { localStorage.setItem('installDismissed', '1'); } catch (e) { /* ignora */ }
      const b = document.getElementById('install-box'); if (b) b.remove();
      return;
    }
    if (ev.target.closest('#install-go') && deferredInstall) {
      deferredInstall.prompt(); deferredInstall = null;
      return;
    }
    const a = ev.target.closest('a[href^="#"]');
    if (a && a.closest('#search')) closeSearch();
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'rifiuti-search') fillGlossario();
    if (ev.target.id === 'search-input') doSearch(ev.target.value);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !document.getElementById('search').hidden) closeSearch();
    if (ev.key === '/' && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(document.activeElement.tagName) === -1) { ev.preventDefault(); openSearch(); }
  });
  document.getElementById('search-open').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('lang-toggle').addEventListener('click', function () { I.setLang(getLang() === 'it' ? 'en' : 'it'); });
  window.addEventListener('hashchange', route);
  window.addEventListener('langchange', function () { index = null; route(); });
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });

  function onlineState() { document.getElementById('offline-bar').hidden = navigator.onLine !== false; }
  window.addEventListener('online', onlineState);
  window.addEventListener('offline', onlineState);

  /* ---------- avvio ---------- */
  I.applyI18n();
  onlineState();
  loadJSON('meta').then(route);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline non critico */ });
    });
  }
})();
