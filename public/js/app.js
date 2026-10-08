/* Positano.app · logica applicativa v0.2 (vanilla JS, nessuna build) */
(function () {
  'use strict';

  const I = window.PA_I18N, O = window.PA_OGGI;
  const t = I.t, getLang = I.getLang;

  /* Sezioni: id, file dati, icona, tinta. L'ordine è quello della pagina «Tutto» e della home. */
  const SECTIONS = [
    { id: 'emergenze', file: 'numeri-utili', icon: 'sos', tint: 'red' },
    { id: 'muoversi', file: 'trasporti', icon: 'bus', tint: 'blue' },
    { id: 'rifiuti', file: 'rifiuti', icon: 'recycle', tint: 'green' },
    { id: 'mare', file: 'spiagge', icon: 'beach', tint: 'sea' },
    { id: 'sentieri', file: 'sentieri', icon: 'hike', tint: 'olive' },
    { id: 'eventi', file: 'eventi', icon: 'calendar', tint: 'terra' },
    { id: 'luoghi', file: 'luoghi', icon: 'eye', tint: 'gold' },
    { id: 'comune', file: 'comune', icon: 'townhall', tint: 'slate' },
    { id: 'info', file: null, icon: 'info', tint: 'slate' }
  ];
  const TABS = ['home', 'emergenze', 'muoversi', 'rifiuti', 'tutto'];
  const ALL_FILES = ['numeri-utili', 'trasporti', 'rifiuti', 'spiagge', 'sentieri', 'eventi', 'luoghi', 'comune', 'avvisi', 'meta'];
  const cache = {};
  const view = document.getElementById('view');
  let firstRender = true;
  let deferredInstall = null;

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

  function loadJSON(name) {
    if (cache[name]) return Promise.resolve(cache[name]);
    return fetch('data/' + name + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache[name] = j; return j; })
      .catch(function () { return null; });
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

  function updatedLine(data) {
    if (!data || !data.aggiornato) return '';
    return '<p class="updated">' + esc(t('common.updated')) + ' ' + esc(dateLabel(data.aggiornato, { year: 'numeric' })) + '</p>';
  }

  function reportLine(sectionId) {
    const meta = cache.meta || {};
    if (!meta.segnalazioni) return '';
    const url = meta.segnalazioni + '?title=' + encodeURIComponent('[' + sectionId + '] ');
    return '<p class="updated"><a href="' + esc(url) + '" rel="noopener">' + esc(t('common.report')) + '</a></p>';
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

  /* ---------- una scheda (voce) ---------- */
  function renderVoce(v, sectionId) {
    const id = v.id ? 'v-' + v.id : '';
    let h = '<article class="item"' + (id ? ' id="' + esc(id) + '"' : '') + '>';
    const shareBtn = v.id && sectionId ? '<button type="button" class="share-btn" data-share="#' + esc(sectionId + '/' + v.id) + '" data-title="' + esc(pick(v.nome)) + '" aria-label="' + esc(t('common.share')) + '">' + icon('share') + '</button>' : '';
    h += '<div class="item-head"><h3>' + esc(pick(v.nome)) + '</h3>' + badges(v) + shareBtn + '</div>';
    if (v.sottotitolo) h += '<p class="sub">' + esc(pick(v.sottotitolo)) + '</p>';
    if (v.periodo) {
      const on = O.inPeriod(v.periodo, today());
      h += '<p class="state ' + (on ? 'on' : 'off') + '">' + esc(t(on ? 'common.active' : 'common.inactive')) +
        (v.periodo.testo ? ' · ' + esc(pick(v.periodo.testo)) : '') + '</p>';
    }
    if (v.dettagli && v.dettagli.length) {
      h += '<ul class="chips">' + v.dettagli.map(function (d) { return '<li>' + esc(pick(d)) + '</li>'; }).join('') + '</ul>';
    }
    if (v.nota) h += '<p>' + esc(pick(v.nota)) + '</p>';
    if (v.punti && v.punti.length) h += '<ul class="bullets">' + v.punti.map(function (p) { return '<li>' + esc(pick(p)) + '</li>'; }).join('') + '</ul>';
    if (v.orari) h += '<p class="hours">' + icon('clock') + '<span>' + esc(pick(v.orari)) + '</span></p>';
    if (v.indirizzo) h += '<p class="addr">' + icon('pin') + '<span>' + esc(pick(v.indirizzo)) + '</span></p>';

    const acts = [];
    const tels = Array.isArray(v.tel) ? v.tel : (v.tel ? [{ n: v.tel }] : []);
    tels.forEach(function (x, i) {
      const n = typeof x === 'string' ? x : x.n;
      const lab = typeof x === 'object' && x.label ? pick(x.label) + ' · ' : '';
      acts.push('<a class="act act-call' + (i === 0 && v.verificato !== false ? ' primary' : '') + '" href="' + esc(telHref(n)) + '">' + icon('phone') + '<span>' + esc(lab + n) + '</span></a>');
    });
    if (v.coord) acts.push('<a class="act" href="' + esc(mapHref(v.coord, pick(v.nome))) + '" rel="noopener">' + icon('pin') + '<span>' + esc(t('common.map')) + '</span></a>');
    if (v.web) acts.push('<a class="act" href="' + esc(v.web) + '" rel="noopener">' + icon('link') + '<span>' + esc(pick(v.webLabel) || t('common.web')) + '</span></a>');
    if (v.email) acts.push('<a class="act" href="mailto:' + esc(v.email) + '">' + icon('mail') + '<span>' + esc(v.email) + '</span></a>');
    if (v.pec) acts.push('<a class="act" href="mailto:' + esc(v.pec) + '">' + icon('mail') + '<span>' + esc(t('common.pec')) + '</span></a>');
    if (acts.length) h += '<div class="acts">' + acts.join('') + '</div>';

    if (v.fonte) {
      const f = v.fonte;
      const label = esc(t('common.source')) + ': ' + (f.url ? '<a href="' + esc(f.url) + '" rel="noopener">' + esc(pick(f.nome) || f.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + '</a>' : esc(pick(f.nome))) +
        (f.data ? ' · ' + esc(dateLabel(f.data, { year: 'numeric', month: 'short' })) : '') +
        (f.consultata ? ' · ' + esc(t('common.checked')) + ' ' + esc(dateLabel(f.consultata, { year: 'numeric', month: 'short' })) : '');
      h += '<p class="src">' + label + '</p>';
    }
    return h + '</article>';
  }

  function sectionHeader(s, data) {
    let h = TABS.indexOf(s.id) === -1 ? '<a class="crumb" href="#tutto">' + icon('back') + '<span>' + esc(t('sec.tutto')) + '</span></a>' : '';
    h += '<header class="sec-head tint-' + s.tint + '"><span class="sec-ic">' + icon(s.icon) + '</span><div><h1 tabindex="-1">' + esc(t('sec.' + s.id)) + '</h1>';
    if (data && data.intro) h += '<p>' + esc(pick(data.intro)) + '</p>';
    return h + '</div></header>';
  }

  function renderGroups(data, sectionId) {
    return (data.gruppi || []).map(function (g) {
      return '<section class="group"' + (g.id ? ' id="g-' + esc(g.id) + '"' : '') + '><h2 class="group-title">' + esc(pick(g.titolo)) + '</h2>' +
        (g.nota ? '<p class="note">' + esc(pick(g.nota)) + '</p>' : '') +
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

  /* ---------- pagine ---------- */
  function renderSection(s) {
    return loadJSON(s.file).then(function (data) {
      if (!data) return sectionHeader(s) + '<p class="note">' + esc(t('common.offline')) + '</p>';
      return sectionHeader(s, data) + groupJump(data) + renderGroups(data, s.id) + updatedLine(data) + reportLine(s.id);
    });
  }

  function wasteFor(data, iso) {
    // Il calendario dice cosa si espone la sera di ogni giorno della settimana.
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
        h += '<div class="panel tint-green"><p class="panel-k">' + esc(t('home.waste.today')) + badges(cal) + '</p>' +
          '<p class="panel-v">' + (tonight.length ? tonight.map(fraz).join(' ') : esc(t('home.waste.none'))) + '</p>' +
          (cal.esposizione ? '<p class="note">' + esc(pick(cal.esposizione)) + '</p>' : '') + '</div>';
        h += '<h2 class="group-title">' + esc(t('rifiuti.week')) + '</h2><ol class="week">';
        for (let i = 0; i < 7; i++) {
          const d = O.addDays(iso, i);
          const fs = frazioni(data, cal.sere[String(O.weekday(d))] || []);
          h += '<li' + (i === 0 ? ' class="is-today"' : '') + '><span class="wd">' + esc(i === 0 ? t('rifiuti.tonight') : dateLabel(d, { weekday: 'short', day: 'numeric', month: undefined })) + '</span><span>' +
            (fs.length ? fs.map(fraz).join(' ') : '<span class="muted">' + esc(t('rifiuti.nothing')) + '</span>') + '</span></li>';
        }
        h += '</ol>';
        if (cal.nota) h += '<p class="note"><span class="q">?</span> ' + esc(pick(cal.nota)) + '</p>';
        if (cal.fonte) h += renderVoce({ nome: '', fonte: cal.fonte }).replace('<article class="item">', '<div class="src-only">').replace(/<div class="item-head">.*?<\/div>/, '').replace(/<\/article>$/, '</div>');
      }
      if (data.avviso) h += '<p class="note callout">' + esc(pick(data.avviso)) + '</p>';
      h += '<h2 class="group-title">' + esc(t('rifiuti.glossario')) + '</h2>' +
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

  function upcomingEvents(data, limit) {
    const iso = today();
    const list = (data && data.eventi || []).map(function (e) {
      const occ = O.nextOccurrence(e, iso);
      return occ ? Object.assign({}, e, { _da: occ.data, _a: occ.fine, _stimata: occ.stimata }) : null;
    }).filter(Boolean).sort(function (a, b) { return a._da.localeCompare(b._da); });
    return limit ? list.slice(0, limit) : list;
  }

  function eventRow(e) {
    if (e._stimata) return eventRowEstimated(e);
    const a = e._da.split('-');
    const range = e._a && e._a !== e._da ? ' – ' + dateLabel(e._a) : '';
    let h = '<article class="event" id="v-' + esc(e.id || '') + '"><div class="ev-date"><span class="d">' + Number(a[2]) + '</span><span class="m">' +
      esc(dateLabel(e._da, { day: undefined, month: 'short' })) + '</span></div><div class="ev-body">' +
      '<div class="item-head"><h3>' + esc(pick(e.titolo)) + '</h3>' + badges(e) + (e.id ? '<button type="button" class="share-btn" data-share="#eventi/' + esc(e.id) + '" data-title="' + esc(pick(e.titolo)) + '" aria-label="' + esc(t('common.share')) + '">' + icon('share') + '</button>' : '') + '</div>' +
      '<p class="sub">' + esc(dateLabel(e._da, { weekday: 'long' })) + range + (e.orario ? ' · ' + esc(pick(e.orario)) : '') + ' · ' + esc(relDay(e._da)) + '</p>';
    if (e._stimata) h += '<p class="note">' + esc(t('common.estimated')) + '</p>';
    if (e.luogo) h += '<p class="addr">' + icon('pin') + '<span>' + esc(pick(e.luogo)) + '</span></p>';
    if (e.nota) h += '<p>' + esc(pick(e.nota)) + '</p>';
    const acts = [];
    if (e.coord) acts.push('<a class="act" href="' + esc(mapHref(e.coord, pick(e.luogo))) + '" rel="noopener">' + icon('pin') + '<span>' + esc(t('common.map')) + '</span></a>');
    if (e.web) acts.push('<a class="act" href="' + esc(e.web) + '" rel="noopener">' + icon('link') + '<span>' + esc(t('common.web')) + '</span></a>');
    if (acts.length) h += '<div class="acts">' + acts.join('') + '</div>';
    if (e.fonte) h += '<p class="src">' + esc(t('common.source')) + ': ' + (e.fonte.url ? '<a href="' + esc(e.fonte.url) + '" rel="noopener">' + esc(pick(e.fonte.nome) || 'link') + '</a>' : esc(pick(e.fonte.nome))) + '</p>';
    return h + '</div></article>';
  }

  function eventRowEstimated(e) {
    const range = e._a && e._a !== e._da ? dateLabel(e._da, { month: undefined }) + '-' + dateLabel(e._a) : dateLabel(e._da);
    return '<a class="menu-row ev-mini" href="#eventi/' + esc(e.id || '') + '" id="v-' + esc(e.id || '') + '"><span><strong>' + esc(pick(e.titolo)) + '</strong>' +
      '<small>' + esc(t('eventi.usually', { d: range })) + (e.luogo ? ' · ' + esc(pick(e.luogo)) : '') + '</small></span></a>';
  }

  function renderEventi() {
    const s = section('eventi');
    return loadJSON('eventi').then(function (data) {
      if (!data) return sectionHeader(s) + '<p class="note">' + esc(t('common.offline')) + '</p>';
      const list = upcomingEvents(data);
      let h = sectionHeader(s, data);
      if (!list.length) h += '<p class="note">' + esc(t('eventi.none')) + '</p>';
      const certi = list.filter(function (e) { return !e._stimata; });
      const stimati = list.filter(function (e) { return e._stimata; });
      let lastMonth = '';
      certi.forEach(function (e) {
        const m = e._da.slice(0, 7);
        if (m !== lastMonth) { h += '<h2 class="group-title">' + esc(dateLabel(e._da, { day: undefined, month: 'long', year: 'numeric' })) + '</h2>'; lastMonth = m; }
        h += eventRow(e);
      });
      if (stimati.length) {
        h += '<h2 class="group-title">' + esc(t('eventi.yearly')) + '</h2><p class="note">' + esc(t('eventi.yearly.note')) + '</p><div class="menu">' + stimati.map(eventRowEstimated).join('') + '</div>';
      }
      return h + updatedLine(data) + reportLine('eventi');
    });
  }

  function hello() {
    const m = O.minutesRome();
    return t(m < 13 * 60 ? 'home.hello.morning' : m < 18 * 60 ? 'home.hello.afternoon' : 'home.hello.evening');
  }

  function seasonLine(meta, iso) {
    const st = meta && meta.stagioni;
    if (!st) return '';
    const k = O.inPeriod(st.alta, iso) ? 'high' : O.inPeriod(st.bassa, iso) ? 'low' : 'mid';
    return '<p class="season">' + esc(t('home.season.' + k)) + '</p>';
  }

  function tile(s) {
    return '<a class="tile tint-' + s.tint + '" href="#' + s.id + '"><span class="tile-ic">' + icon(s.icon) + '</span>' +
      '<span class="tile-t">' + esc(t('sec.' + s.id)) + '</span><span class="tile-d">' + esc(t('desc.' + s.id)) + '</span></a>';
  }

  function renderHome() {
    return Promise.all(['meta', 'avvisi', 'rifiuti', 'eventi', 'trasporti'].map(loadJSON)).then(function (r) {
      const meta = r[0], avvisi = r[1], rifiuti = r[2], eventi = r[3], trasporti = r[4];
      const iso = today();
      const sun = O.sunTimes(iso);
      let h = '<section class="hero"><p class="hero-k">' + esc(hello()) + '</p>' +
        '<h1 tabindex="-1">' + esc(dateLabel(iso, { weekday: 'long' })) + '</h1>';
      if (sun) h += '<p class="sun">' + icon('sun') + '<span>' + esc(t('home.sunrise')) + ' ' + esc(O.formatTime(sun.alba, getLang())) + '</span>' +
        icon('sunset') + '<span>' + esc(t('home.sunset')) + ' ' + esc(O.formatTime(sun.tramonto, getLang())) + '</span></p>';
      h += seasonLine(meta, iso) + '</section>';

      h += '<a class="sos" href="tel:112">' + icon('phone') + '<span><strong>' + esc(t('home.sos')) + '</strong><small>' + esc(t('home.sos.sub')) + '</small></span></a>';

      const active = (avvisi && avvisi.avvisi || []).filter(function (a) { return O.inPeriod({ dal: a.dal, al: a.al }, iso); });
      if (active.length) {
        h += '<h2 class="group-title">' + esc(t('home.alerts')) + '</h2>';
        h += active.map(function (a) {
          return '<details class="alert ' + (a.livello === 'attenzione' ? 'warn' : '') + '"><summary>' + icon('alert') + '<span><strong>' + esc(pick(a.titolo)) + '</strong>' + badges(a) + '</span>' + icon('chevron', 'chev') + '</summary>' +
            '<div class="alert-body"><p>' + esc(pick(a.testo)) + '</p>' + (a.fonte && a.fonte.url ? '<p class="src">' + esc(t('common.source')) + ': <a href="' + esc(a.fonte.url) + '" rel="noopener">' + esc(pick(a.fonte.nome) || 'link') + '</a></p>' : '') + '</div></details>';
        }).join('');
      }

      const tonight = wasteFor(rifiuti, iso);
      if (tonight) {
        h += '<a class="panel tint-green link-panel" href="#rifiuti">' + icon('recycle', 'panel-ic') + '<span><span class="panel-k">' + esc(t('home.waste.today')) + '</span>' +
          '<span class="panel-v">' + (tonight.length ? tonight.map(fraz).join(' ') : esc(t('home.waste.none'))) + '</span></span>' + icon('chevron', 'chev') + '</a>';
      }

      h += targheBox(trasporti, iso) + departuresBox(trasporti, iso);

      const evs = upcomingEvents(eventi).filter(function (e) { return !e._stimata; }).slice(0, 3);
      if (evs.length) {
        h += '<h2 class="group-title">' + esc(t('home.events')) + '</h2>' + evs.map(eventRow).join('') +
          '<p><a class="more" href="#eventi">' + esc(t('home.events.all')) + ' ' + icon('chevron') + '</a></p>';
      }

      h += '<h2 class="group-title">' + esc(t('home.sections')) + '</h2><div class="tiles">' + SECTIONS.filter(function (s) { return s.id !== 'info'; }).map(tile).join('') + '</div>';
      h += installBox();
      return h;
    });
  }

  /* Targhe alterne: nei giorni pari non circolano le targhe pari, nei dispari le dispari. */
  function targheBox(tr, iso) {
    const ta = tr && tr.targhe;
    if (!ta || (ta.giorni || []).indexOf(iso) === -1) return '';
    const pari = Number(iso.slice(8)) % 2 === 0;
    return '<a class="alert warn" href="#muoversi/targhe-alterne">' + icon('car') + '<div><strong>' + esc(t('home.plates.title')) + '</strong>' + badges(ta) +
      '<p>' + esc(t(pari ? 'home.plates.even' : 'home.plates.odd', { h: ta.orario })) + '</p></div></a>';
  }

  /* Prossime partenze di oggi (traghetti, ultimo bus) calcolate sull'ora di Positano. */
  function departuresBox(tr, iso) {
    const now = O.minutesRome();
    const rows = (tr && tr.partenze || []).filter(function (p) { return O.inPeriod({ dal: p.dal, al: p.al }, iso); }).map(function (p) {
      const next = (p.orari || []).filter(function (o) { const a = o.split(':'); return Number(a[0]) * 60 + Number(a[1]) >= now; });
      if (!next.length) return '';
      const list = p.soloUltima ? next.slice(0, 1) : next.slice(0, 3);
      return '<a class="dep" href="' + esc(p.link || '#muoversi') + '"><span class="dep-ic">' + icon(p.id.indexOf('sita') === 0 ? 'bus' : 'boat') + '</span><span class="dep-b"><strong>' + esc(pick(p.nome)) + '</strong>' +
        '<small>' + esc(pick(p.da)) + '</small></span><span class="dep-t">' + list.map(function (o, i) { return '<b' + (i ? ' class="later"' : '') + '>' + esc(o) + '</b>'; }).join('') + '</span></a>';
    }).filter(Boolean);
    if (!rows.length) return '';
    return '<h2 class="group-title">' + esc(t('home.departures')) + '</h2><div class="deps">' + rows.join('') + '</div>';
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
    return Promise.resolve('<header class="sec-head"><div><h1 tabindex="-1">' + esc(t('sec.tutto')) + '</h1></div></header><div class="menu">' +
      SECTIONS.map(function (s) {
        return '<a class="menu-row" href="#' + s.id + '"><span class="tile-ic tint-' + s.tint + '">' + icon(s.icon) + '</span><span><strong>' + esc(t('sec.' + s.id)) + '</strong><small>' + esc(t('desc.' + s.id)) + '</small></span>' + icon('chevron', 'chev') + '</a>';
      }).join('') + '</div>');
  }

  function renderInfo() {
    const s = section('info');
    return loadJSON('meta').then(function (meta) {
      meta = meta || {};
      let h = sectionHeader(s);
      h += '<div class="prose"><p>' + esc(t('info.text')) + '</p><p>' + esc(t('info.neutral')) + '</p>' +
        '<p class="callout">' + esc(t('info.ai')) + '</p>' +
        '<h2>' + esc(t('info.offline.title')) + '</h2><p>' + esc(t('info.offline')) + '</p>' +
        '<h2>' + esc(t('info.privacy.title')) + '</h2><p>' + esc(t('info.privacy')) + '</p>' +
        '<h2>' + esc(t('install.title')) + '</h2><p>' + esc(t('install.ios')) + '</p><p>' + esc(t('install.android')) + '</p>' +
        '<h2>' + esc(t('info.contribute.title')) + '</h2><p>' + esc(t('info.contribute')) + '</p>' +
        '<p class="note">' + esc(t('info.version')) + ' ' + esc(meta.versione || '') + ' · <a href="' + esc(meta.repo || '#') + '" rel="noopener">' + esc(t('info.code')) + '</a></p></div>';
      return h + reportLine('info');
    });
  }

  /* ---------- ricerca globale ---------- */
  let index = null;
  function buildIndex() {
    return Promise.all(ALL_FILES.map(loadJSON)).then(function () {
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
      return '<a class="menu-row" href="' + esc(href) + '"><span class="tile-ic tint-' + s.tint + '">' + icon(s.icon) + '</span><span><strong>' + esc(pick(h.e.title)) + '</strong><small>' + esc(t('sec.' + s.id)) + '</small></span>' + icon('chevron', 'chev') + '</a>';
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
    return { page: parts[0] || 'home', item: parts[1] || null };
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
    if (page === 'home') p = renderHome();
    else if (page === 'tutto') p = renderTutto();
    else if (page === 'rifiuti') p = renderRifiuti();
    else if (page === 'eventi') p = renderEventi();
    else if (page === 'info') p = renderInfo();
    else p = renderSection(section(page));
    return p.then(function (html) {
      view.innerHTML = html;
      document.title = (page === 'home' ? 'Positano.app · ' + t('app.tagline') : t('sec.' + page) + ' · Positano.app');
      if (page === 'rifiuti') fillGlossario();
      const target = r.item && document.getElementById('v-' + r.item);
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
    if (ev.key === '/' && document.activeElement.tagName !== 'INPUT') { ev.preventDefault(); openSearch(); }
  });
  document.getElementById('search-open').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.getElementById('lang-toggle').addEventListener('click', function () { I.setLang(getLang() === 'it' ? 'en' : 'it'); });
  window.addEventListener('hashchange', route);
  window.addEventListener('langchange', function () { route(); });
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
