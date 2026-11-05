/* Positano.app · «Crea un post»: la grafica 4:5 (1080×1350) di un avviso nello stile dei preset del Comune.
   Misure dal design system: fascia 63 px, fili rossi 11 px, margini 86 px, titolo Cormorant 94, stemma 200 px.
   Tutto avviene sul telefono: la foto non viene caricata da nessuna parte. */
(function () {
  'use strict';

  const CAT = {
    emergenze: ['#B71523', '#FFFFFF'], viabilita: ['#1877BD', '#FFFFFF'], cultura: ['#CA1D6B', '#FFFFFF'], sanita: ['#F4AACC', '#111111'],
    sport: ['#FAB429', '#111111'], ambiente: ['#89B026', '#111111'], turismo: ['#7DC1E7', '#111111'], scuole: ['#E97A28', '#111111'],
    lavori: ['#7D6F64', '#FFFFFF'], sociale: ['#9B72AA', '#FFFFFF'], oggi: ['#00966B', '#FFFFFF'], comunicati: ['#1877BD', '#FFFFFF'],
    extra: ['#004C77', '#FFFFFF'], istituzionale: ['#007A8E', '#FFFFFF'], 'protezione-civile': ['#172C70', '#FFFFFF']
  };
  const OCCHIELLI = ['AVVISO', 'AVVISO AI CITTADINI', 'ALLERTA', 'COMUNICATO', 'COSA C\'È DA FARE'];
  const W = 1080, H = 1350, FILO = '#DD302E';
  let foto = null, stemma = null, A = null;

  function render(api, item) {
    A = api;
    const t = api.t, esc = api.esc;
    const cats = Object.keys(CAT).map(function (c) { return '<option value="' + c + '">' + esc(t('cat.' + c)) + '</option>'; }).join('');
    return api.tuttiAvvisi().then(function (r) {
      const att = api.avvisiAttivi(r.avvisi, api.today());
      const opz = att.map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === item ? ' selected' : '') + '>' + esc(api.pick(a.titolo)) + '</option>'; }).join('');
      return api.sectionHeader('post') + '<p class="note" style="margin:-.4rem 0 1rem">' + esc(t('post.intro')) + '</p>' +
        '<div class="post-form">' +
        (opz ? '<label>' + esc(t('post.da')) + '<select id="p-avviso"><option value="">—</option>' + opz + '</select></label>' : '') +
        '<label>' + esc(t('post.categoria')) + '<select id="p-cat">' + cats + '</select></label>' +
        '<label>' + esc(t('post.occhiello')) + '<select id="p-occ">' + OCCHIELLI.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>' +
        '<label>' + esc(t('post.sopra')) + '<input id="p-sopra" maxlength="60" placeholder="È STATO CONVOCATO IL"></label>' +
        '<label>' + esc(t('post.titolo')) + '<textarea id="p-titolo" rows="2" maxlength="80">Consiglio comunale</textarea></label>' +
        '<label>' + esc(t('post.sotto')) + '<textarea id="p-sotto" rows="2" maxlength="120">Giovedì 12 novembre · ore 17.00\nSala consiliare «Andrea Milano»</textarea></label>' +
        '<label>' + esc(t('post.foto')) + '<input type="file" id="p-foto" accept="image/*"></label>' +
        '<label style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" id="p-stemma" checked style="min-height:auto">' + esc(t('post.stemma')) + '</label>' +
        '<canvas id="p-canvas" class="post-anteprima" width="' + W + '" height="' + H + '" aria-label="' + esc(t('post.anteprima')) + '"></canvas>' +
        '<div class="post-azioni"><button type="button" class="btn" id="p-scarica">' + esc(t('post.scarica')) + '</button><button type="button" class="btn secondario" id="p-testo">' + esc(t('post.copia')) + '</button></div>' +
        '<p class="note">' + esc(t('post.nota')) + '</p></div>';
    });
  }

  function init(api, item) {
    A = api;
    const $ = function (id) { return document.getElementById(id); };
    if (!$('p-canvas')) return;
    if (!stemma) {
      const img = new Image();
      img.onload = function () { stemma = img; disegna(); };
      img.src = 'icons/stemma-comune.svg';
    }
    ['p-cat', 'p-occ', 'p-sopra', 'p-titolo', 'p-sotto', 'p-stemma'].forEach(function (id) { $(id).addEventListener('input', disegna); });
    $('p-foto').addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) { foto = null; disegna(); return; }
      const img = new Image();
      img.onload = function () { foto = img; disegna(); };
      img.src = URL.createObjectURL(f);
    });
    if ($('p-avviso')) $('p-avviso').addEventListener('change', function () { daAvviso(this.value); });
    $('p-scarica').addEventListener('click', function () {
      $('p-canvas').toBlob(function (b) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'post-' + (($('p-titolo').value || 'avviso').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)) + '.png';
        document.body.appendChild(a); a.click(); a.remove();
      }, 'image/png');
    });
    $('p-testo').addEventListener('click', function () {
      const testo = didascalia();
      if (navigator.clipboard) navigator.clipboard.writeText(testo).then(function () { A.toast(A.t('common.copied')); });
    });
    if (item) daAvviso(item);
    else { $('p-cat').value = 'istituzionale'; $('p-occ').value = 'AVVISO AI CITTADINI'; $('p-sopra').value = 'È stato convocato il'; }
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('600 94px "Cormorant Garamond"'), document.fonts.load('700 22px Montserrat'), document.fonts.load('400 32px Montserrat')]).then(disegna, disegna);
    } else disegna();
  }

  function daAvviso(id) {
    if (!id) return;
    A.tuttiAvvisi().then(function (r) {
      const a = r.avvisi.find(function (x) { return x.id === id; });
      if (!a) return;
      const $ = function (k) { return document.getElementById(k); };
      $('p-cat').value = CAT[a.categoria] ? a.categoria : 'istituzionale';
      $('p-occ').value = a.categoria === 'emergenze' ? 'ALLERTA' : 'AVVISO';
      $('p-titolo').value = A.pick(a.titolo);
      $('p-sopra').value = '';
      $('p-sotto').value = a.dal === a.al ? A.dateLabel(a.dal, { weekday: 'long' }) : A.dateLabel(a.dal) + ' – ' + A.dateLabel(a.al);
      disegna();
    });
  }

  function didascalia() {
    const v = function (id) { return (document.getElementById(id).value || '').trim(); };
    let s = v('p-titolo').toUpperCase();
    if (v('p-sopra')) s = v('p-sopra') + ' ' + s;
    s += '\n\n';
    v('p-sotto').split('\n').forEach(function (r, i) { if (r.trim()) s += (i === 0 ? '📅 ' : '📍 ') + r.trim() + '\n'; });
    return s.trim();
  }

  /* Va a capo per larghezza, al massimo n righe. */
  function righe(ctx, testo, max, n) {
    const out = [];
    String(testo).split('\n').forEach(function (par) {
      let riga = '';
      par.split(/\s+/).filter(Boolean).forEach(function (w) {
        const prova = riga ? riga + ' ' + w : w;
        if (ctx.measureText(prova).width > max && riga) { out.push(riga); riga = w; } else riga = prova;
      });
      if (riga) out.push(riga);
    });
    return out.slice(0, n);
  }

  function disegna() {
    const c = document.getElementById('p-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const v = function (id) { return (document.getElementById(id).value || '').trim(); };
    const cat = CAT[v('p-cat')] || CAT.istituzionale;
    const colore = cat[0], testo = cat[1];
    // fondo e fascia bianca con occhiello
    ctx.fillStyle = colore; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, 63);
    ctx.fillStyle = colore === '#F4AACC' || colore === '#FAB429' || colore === '#7DC1E7' || colore === '#89B026' ? '#3A3A3A' : colore;
    ctx.font = '700 22px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v('p-occ'), W / 2, 33);
    ctx.fillStyle = FILO; ctx.fillRect(0, 63, W, 11);
    // foto nella metà alta, che sfuma nel colore della categoria
    let yTesti = 430;
    if (foto) {
      const top = 74, h = 640, r = Math.max(W / foto.width, h / foto.height);
      const fw = foto.width * r, fh = foto.height * r;
      ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
      ctx.drawImage(foto, (W - fw) / 2, top + (h - fh) / 2, fw, fh); ctx.restore();
      const g = ctx.createLinearGradient(0, top + h * 0.45, 0, top + h);
      g.addColorStop(0, hexA(colore, 0)); g.addColorStop(1, hexA(colore, 1));
      ctx.fillStyle = g; ctx.fillRect(0, top + h * 0.45, W, h * 0.55 + 1);
      yTesti = 650;
    }
    // testi centrati in maiuscolo
    ctx.fillStyle = testo; ctx.textBaseline = 'alphabetic';
    let y = yTesti;
    if (v('p-sopra')) { ctx.font = '400 32px Montserrat, Arial, sans-serif'; ctx.fillText(v('p-sopra').toUpperCase(), W / 2, y); y += 30; }
    ctx.font = '600 94px "Cormorant Garamond", Garamond, serif';
    const tr = righe(ctx, v('p-titolo').toUpperCase(), 908, 3);
    tr.forEach(function (r) { y += 99; ctx.fillText(r, W / 2, y); });
    ctx.font = '400 33px Montserrat, Arial, sans-serif';
    y += 24;
    righe(ctx, v('p-sotto').toUpperCase(), 908, 3).forEach(function (r) { y += 46; ctx.fillText(r, W / 2, y); });
    // stemma e firma
    if (document.getElementById('p-stemma').checked && stemma) {
      const top = Math.max(1062, y + 34), sh = Math.max(90, Math.min(182, 1252 - top)), sw = sh * (stemma.width / stemma.height || 0.68);
      ctx.drawImage(stemma, (W - sw) / 2, top, sw, sh);
    }
    ctx.font = '700 24px Montserrat, Arial, sans-serif';
    ctx.fillText('COMUNE DI POSITANO', W / 2, 1290);
    ctx.fillStyle = FILO; ctx.fillRect(0, H - 11, W, 11);
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  window.PA_POST = { render: render, init: init };
})();
