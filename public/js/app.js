/* Positano.app — logica applicativa v0 */
(function () {
  'use strict';

  const t = window.PA_I18N.t;
  const getLang = window.PA_I18N.getLang;
  const SECTIONS = ['home', 'emergenze', 'trasporti', 'rifiuti', 'mare', 'sentieri', 'eventi', 'info'];
  const HOME_CARDS = [
    { id: 'emergenze', emoji: '🚨' }, { id: 'trasporti', emoji: '🚌' },
    { id: 'rifiuti', emoji: '♻️' }, { id: 'mare', emoji: '🏖️' },
    { id: 'sentieri', emoji: '🥾' }, { id: 'eventi', emoji: '📅' },
    { id: 'info', emoji: 'ℹ️' }
  ];
  const cache = {};

  /* ---------- utilità ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(field) {
    if (field == null) return '';
    if (typeof field === 'object') return field[getLang()] || field.it || '';
    return field;
  }
  function badge(voce) {
    let out = '';
    if (voce && voce.esempio) out += ' <span class="badge demo">' + esc(t('common.demo')) + '</span>';
    if (voce && voce.verificato === false) out += ' <span class="badge warn">' + esc(t('common.verify')) + '</span>';
    return out;
  }
  function updatedLine(data) {
    if (!data || !data.aggiornato) return '';
    return '<span class="updated">' + esc(t('common.updated')) + ' ' + esc(data.aggiornato) + '</span>';
  }
  function loadJSON(name) {
    if (cache[name]) return Promise.resolve(cache[name]);
    return fetch('data/' + name + '.json')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { cache[name] = j; return j; })
      .catch(function () { return null; });
  }
  function offline(el) { el.innerHTML = '<p class="note">' + esc(t('common.offline')) + '</p>'; }

  /* ---------- router ---------- */
  function show(id) {
    if (SECTIONS.indexOf(id) === -1) id = 'home';
    SECTIONS.forEach(function (s) {
      const el = document.getElementById(s);
      if (el) el.hidden = (s !== id);
    });
    document.querySelectorAll('.bottomnav button').forEach(function (b) {
      if (b.getAttribute('data-nav') === id) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (('#' + id) !== location.hash) history.replaceState(null, '', '#' + id);
    window.scrollTo(0, 0);
    render(id);
  }

  /* ---------- render ---------- */
  function renderHome() {
    const wrap = document.getElementById('home-cards');
    wrap.innerHTML = HOME_CARDS.map(function (c) {
      return '<button type="button" class="card-btn" data-nav="' + c.id + '">' +
        '<span class="emoji" aria-hidden="true">' + c.emoji + '</span>' +
        '<strong>' + esc(t('card.' + c.id)) + '</strong></button>';
    }).join('');
  }

  function renderEmergenze() {
    const el = document.getElementById('list-emergenze');
    loadJSON('numeri-utili').then(function (data) {
      if (!data) return offline(el);
      let html = '';
      (data.gruppi || []).forEach(function (g) {
        html += '<h3 class="group-title">' + esc(pick(g.titolo)) + '</h3>';
        (g.voci || []).forEach(function (v) {
          html += '<div class="item"><h4>' + esc(pick(v.nome)) + badge(v) + '</h4>';
          if (v.nota) html += '<p>' + esc(pick(v.nota)) + '</p>';
          if (v.tel) html += '<a class="tel" href="tel:' + esc(v.tel) + '">📞 ' + esc(v.tel) + '</a>';
          html += '</div>';
        });
      });
      el.innerHTML = html + updatedLine(data);
    });
  }

  function renderTrasporti() {
    const el = document.getElementById('list-trasporti');
    loadJSON('trasporti').then(function (data) {
      if (!data) return offline(el);
      let html = '';
      (data.sezioni || []).forEach(function (s) {
        html += '<h3 class="group-title">' + esc(pick(s.titolo)) + '</h3>';
        (s.voci || []).forEach(function (v) {
          html += '<div class="item"><h4>' + esc(pick(v.nome)) + badge(v) + '</h4>';
          if (v.nota) html += '<p>' + esc(pick(v.nota)) + '</p>';
          if (v.link) html += '<p><a href="' + esc(v.link) + '" rel="noopener">' + esc(v.link.replace(/^https?:\/\//, '')) + '</a></p>';
          if (v.tel) html += '<a class="tel" href="tel:' + esc(v.tel) + '">📞 ' + esc(v.tel) + '</a>';
          html += '</div>';
        });
      });
      el.innerHTML = html + updatedLine(data);
    });
  }

  function renderRifiuti() {
    const avviso = document.getElementById('rifiuti-avviso');
    const el = document.getElementById('list-glossario');
    loadJSON('rifiuti').then(function (data) {
      if (!data) return offline(el);
      avviso.textContent = pick(data.avviso);
      const q = (document.getElementById('rifiuti-search').value || '').toLowerCase().trim();
      const items = (data.glossario || []).filter(function (g) {
        if (!q) return true;
        return (pick(g.voce) + ' ' + pick(g.dove)).toLowerCase().indexOf(q) !== -1;
      });
      el.innerHTML = items.map(function (g) {
        return '<div class="item"><h4>' + esc(pick(g.voce)) + '</h4><p>→ ' + esc(pick(g.dove)) + '</p></div>';
      }).join('') + updatedLine(data);
    });
  }

  function renderSpiagge() {
    const el = document.getElementById('list-spiagge');
    loadJSON('spiagge').then(function (data) {
      if (!data) return offline(el);
      el.innerHTML = (data.spiagge || []).map(function (s) {
        let html = '<div class="item"><h4>' + esc(pick(s.nome)) + badge(s) + '</h4>';
        if (s.accesso) html += '<p>' + esc(pick(s.accesso)) + '</p>';
        if (s.nota) html += '<p>' + esc(pick(s.nota)) + '</p>';
        return html + '</div>';
      }).join('') + updatedLine(data);
    });
  }

  function renderSentieri() {
    const el = document.getElementById('list-sentieri');
    loadJSON('sentieri').then(function (data) {
      if (!data) return offline(el);
      el.innerHTML = (data.sentieri || []).map(function (s) {
        let html = '<div class="item"><h4>' + esc(pick(s.nome)) + badge(s) + '</h4>';
        const specs = [];
        if (s.da && s.a) specs.push(esc(pick(s.da)) + ' → ' + esc(pick(s.a)));
        if (s.lunghezza) specs.push(esc(s.lunghezza));
        if (s.durata) specs.push(esc(s.durata));
        if (s.difficolta) specs.push(esc(s.difficolta));
        if (specs.length) html += '<p>' + specs.join(' · ') + '</p>';
        if (s.nota) html += '<p>' + esc(pick(s.nota)) + '</p>';
        return html + '</div>';
      }).join('') + updatedLine(data);
    });
  }

  function renderEventi() {
    const el = document.getElementById('list-eventi');
    loadJSON('eventi').then(function (data) {
      if (!data) return offline(el);
      const today = new Date().toISOString().slice(0, 10);
      const list = (data.eventi || []).filter(function (e) {
        return !e.data || e.data >= today || e.ricorrente;
      }).sort(function (a, b) { return (a.data || '').localeCompare(b.data || ''); });
      if (!list.length) { el.innerHTML = '<p class="note">' + esc(t('eventi.none')) + '</p>' + updatedLine(data); return; }
      el.innerHTML = list.map(function (e) {
        let html = '<div class="item"><h4>' + esc(pick(e.titolo)) + badge(e) + '</h4>';
        const specs = [];
        if (e.data) specs.push(esc(e.data));
        if (e.luogo) specs.push(esc(pick(e.luogo)));
        if (specs.length) html += '<p>' + specs.join(' · ') + '</p>';
        if (e.nota) html += '<p>' + esc(pick(e.nota)) + '</p>';
        return html + '</div>';
      }).join('') + updatedLine(data);
    });
  }

  function renderInfo() {
    loadJSON('meta').then(function (data) {
      if (!data) return;
      const v = document.getElementById('app-version');
      if (v && data.versione) v.textContent = data.versione;
      const r = document.getElementById('repo-link');
      if (r && data.repo) r.href = data.repo;
    });
  }

  function render(id) {
    switch (id) {
      case 'home': renderHome(); break;
      case 'emergenze': renderEmergenze(); break;
      case 'trasporti': renderTrasporti(); break;
      case 'rifiuti': renderRifiuti(); break;
      case 'mare': renderSpiagge(); break;
      case 'sentieri': renderSentieri(); break;
      case 'eventi': renderEventi(); break;
      case 'info': renderInfo(); break;
    }
  }

  /* ---------- eventi UI ---------- */
  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest('[data-nav]');
    if (btn) show(btn.getAttribute('data-nav'));
  });
  document.getElementById('lang-it').addEventListener('click', function () { window.PA_I18N.setLang('it'); });
  document.getElementById('lang-en').addEventListener('click', function () { window.PA_I18N.setLang('en'); });
  document.getElementById('rifiuti-search').addEventListener('input', renderRifiuti);
  window.addEventListener('hashchange', function () { show(location.hash.replace('#', '')); });
  window.addEventListener('langchange', function () {
    const current = location.hash.replace('#', '') || 'home';
    render(current);
    if (current !== 'home') renderHome();
  });

  /* ---------- banner installazione ---------- */
  (function installBanner() {
    const banner = document.getElementById('install-banner');
    if (!banner) return;
    let dismissed = false;
    try { dismissed = localStorage.getItem('installDismissed') === '1'; } catch (e) { /* ignora */ }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (!dismissed && !standalone) banner.hidden = false;
    document.getElementById('install-dismiss').addEventListener('click', function () {
      banner.hidden = true;
      try { localStorage.setItem('installDismissed', '1'); } catch (e) { /* ignora */ }
    });
  })();

  /* ---------- avvio ---------- */
  window.PA_I18N.applyI18n();
  show(location.hash.replace('#', '') || 'home');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline non critico */ });
    });
  }
})();
