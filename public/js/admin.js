/* Positano.app · pannello di redazione. Parla solo con /api/* dello stesso sito. */
(function () {
  'use strict';
  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const CAT_LOCALI = { ristorante: 'Ristorante', bar: 'Bar', pizzeria: 'Pizzeria', alimentari: 'Alimentari', pasticceria: 'Pasticceria', albergo: 'Albergo', negozio: 'Negozio', servizi: 'Servizi' };
  const CAT_AVVISI = { istituzionale: 'Avviso ai cittadini', emergenze: 'Emergenze', 'protezione-civile': 'Protezione civile', viabilita: 'Viabilità', ambiente: 'Ambiente, acqua, rifiuti', lavori: 'Lavori pubblici', sanita: 'Sanità', sociale: 'Sociale', scuole: 'Scuole', cultura: 'Cultura ed eventi', sport: 'Sport', turismo: 'Turismo', oggi: 'Oggi a Positano', comunicati: 'Servizi' };
  const MODI = { '': 'Automatica (secondo data e allerte)', ordinaria: 'Ordinaria', inverno: 'Inverno', natale: 'Natale', estate: 'Estate', festa: 'Giorno di festa', allerta: 'Allerta' };
  const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const SERVIZI = { '': 'Nessuno', acqua: 'Acqua', luce: 'Luce', gas: 'Gas', strade: 'Strade' };
  let tabCorrente = 'aperture', dati = {};

  function api(metodo, path, body) {
    return fetch('api/' + path, {
      method: metodo, credentials: 'same-origin',
      headers: Object.assign({ 'x-pannello': '1' }, body ? { 'content-type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { const e = new Error(j.errore || ('Errore ' + r.status)); e.status = r.status; e.dati = j; throw e; }
        return j;
      });
    });
  }
  function toast(m) { const el = $('toast'); el.textContent = m; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2500); }
  function mostra(id) { ['accesso', 'cambio', 'pannello'].forEach(function (s) { $(s).hidden = s !== id; }); $('esci').hidden = id === 'accesso'; }
  function oggi() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date()); }
  function dataIt(iso) { if (!iso) return ''; const a = iso.split('-'); return Number(a[2]) + '/' + Number(a[1]) + '/' + a[0].slice(2); }

  function avvio() {
    api('GET', 'io').then(function (u) {
      if (u.cambiare_password) return mostra('cambio');
      $('chi').textContent = 'Collegato come ' + u.email + '. Le modifiche sono online entro un minuto.';
      mostra('pannello'); apriTab(tabCorrente);
    }).catch(function () { mostra('accesso'); });
  }

  $('f-accesso').addEventListener('submit', function (e) {
    e.preventDefault(); $('a-msg').textContent = '';
    api('POST', 'accesso', { email: $('a-email').value, password: $('a-pw').value }).then(avvio).catch(function (err) { $('a-msg').textContent = err.message; });
  });
  $('f-cambio').addEventListener('submit', function (e) {
    e.preventDefault(); $('c-msg').textContent = '';
    api('POST', 'password', { attuale: $('c-old').value, nuova: $('c-new').value }).then(function () { toast('Password salvata'); avvio(); }).catch(function (err) { $('c-msg').textContent = err.message; });
  });
  $('esci').addEventListener('click', function () { api('POST', 'esci', {}).then(function () { mostra('accesso'); }); });
  document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { apriTab(b.getAttribute('data-tab')); }); });

  function apriTab(id) {
    tabCorrente = id;
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === id)); });
    $('tab').innerHTML = '<p class="note">Carico…</p>';
    ({ aperture: tabAperture, avvisi: tabAvvisi, proposte: tabProposte, notifiche: tabNotifiche, comune: tabComune, home: tabHome, stato: tabStato, registro: tabRegistro })[id]();
  }

  /* ---------- aperture invernali ---------- */
  function tabAperture() {
    Promise.all([api('GET', 'locali'), api('GET', 'config')]).then(function (r) {
      dati.locali = r[0]; dati.config = r[1];
      const st = r[1].stagione || {};
      const zone = (st.zone || []).slice();
      r[0].forEach(function (l) { const z = l.zona || 'Altre zone'; if (zone.indexOf(z) === -1) zone.push(z); });
      let h = '<p class="note" style="margin-bottom:.8rem">Nell\'app i locali compaiono raggruppati per zona (nell\'ordine qui sotto) e in ordine alfabetico, a parità di trattamento.</p>';
      h += '<div class="post-azioni" style="margin-bottom:1rem"><button class="btn" id="nuovo-locale">Aggiungi un locale</button><button class="btn secondario" id="importa">Importa un elenco</button><button class="btn secondario" id="stagione">Stagione e zone</button></div><div id="form-l"></div>';
      zone.forEach(function (z) {
        const ls = r[0].filter(function (l) { return (l.zona || 'Altre zone') === z; }).sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
        if (!ls.length) return;
        h += '<h2 class="titolo-sez">' + esc(z) + '</h2><div class="elenco">' + ls.map(function (l) {
          return '<div class="riga-l"><div><strong>' + esc(l.nome) + '</strong>' + (l.visibile ? '' : ' <span class="badge warn">nascosto</span>') + '<small>' + esc(CAT_LOCALI[l.categoria] || l.categoria) + ' · ' +
            esc(l.periodi.map(function (p) { return dataIt(p.dal) + '-' + dataIt(p.al) + (p.giorni ? ' (' + p.giorni.map(function (g) { return GIORNI[g]; }).join(' ') + ')' : ''); }).join(', ') || 'nessuna data') + '</small></div>' +
            '<button class="btn secondario" data-modifica-l="' + l.id + '">Modifica</button></div>';
        }).join('') + '</div>';
      });
      if (!r[0].length) h += '<p class="note">Nessun locale ancora. Aggiungili uno per uno o incolla l\'elenco con «Importa un elenco».</p>';
      $('tab').innerHTML = h;
      $('nuovo-locale').onclick = function () { formLocale(null); };
      $('importa').onclick = formImporta;
      $('stagione').onclick = function () { formStagione(st, zone); };
      document.querySelectorAll('[data-modifica-l]').forEach(function (b) { b.onclick = function () { formLocale(dati.locali.find(function (l) { return l.id === Number(b.getAttribute('data-modifica-l')); })); }; });
    }).catch(errore);
  }

  function rigaPeriodo(p) {
    p = p || {};
    return '<div class="periodo" data-periodo>' +
      '<label>Dal<input type="date" name="dal" value="' + esc(p.dal || '') + '" required></label>' +
      '<label>Al<input type="date" name="al" value="' + esc(p.al || '') + '" required></label>' +
      '<div class="giorni"><span>Solo questi giorni (vuoto = tutti):</span>' + GIORNI.map(function (g, k) {
        return '<label><input type="checkbox" name="g" value="' + k + '"' + (p.giorni && p.giorni.indexOf(k) !== -1 ? ' checked' : '') + '>' + g + '</label>';
      }).join('') + '</div>' +
      '<label class="full">Nota (facoltativa)<input name="nota" maxlength="120" value="' + esc(p.nota || '') + '" placeholder="solo a pranzo, su prenotazione…"></label>' +
      '<button type="button" class="btn secondario full" data-togli-periodo>Togli questo periodo</button></div>';
  }

  function formLocale(l) {
    l = l || { nome: '', categoria: 'ristorante', zona: '', periodi: [], visibile: true };
    const zone = (dati.config.stagione && dati.config.stagione.zone || []);
    $('form-l').innerHTML = '<form class="scheda" id="f-l"><h2 class="titolo-sez" style="margin-top:0">' + (l.id ? 'Modifica ' + esc(l.nome) : 'Nuovo locale') + '</h2>' +
      '<div class="due"><label>Nome<input name="nome" required maxlength="80" value="' + esc(l.nome) + '"></label>' +
      '<label>Categoria<select name="categoria">' + Object.keys(CAT_LOCALI).map(function (c) { return '<option value="' + c + '"' + (c === l.categoria ? ' selected' : '') + '>' + CAT_LOCALI[c] + '</option>'; }).join('') + '</select></label>' +
      '<label>Zona<input name="zona" list="zone-l" maxlength="60" value="' + esc(l.zona || '') + '"><datalist id="zone-l">' + zone.map(function (z) { return '<option value="' + esc(z) + '">'; }).join('') + '</datalist></label>' +
      '<label>Telefono fisso (facoltativo)<input name="telefono" maxlength="30" value="' + esc(l.telefono || '') + '"></label></div>' +
      '<label>Indirizzo (facoltativo)<input name="indirizzo" maxlength="120" value="' + esc(l.indirizzo || '') + '"></label>' +
      '<label>Nota (facoltativa)<input name="nota" maxlength="300" value="' + esc(l.nota || '') + '"></label>' +
      '<div><strong style="font-size:.88rem">Periodi di apertura</strong><div id="periodi" style="display:grid;gap:.5rem;margin-top:.4rem">' + l.periodi.map(rigaPeriodo).join('') + '</div>' +
      '<button type="button" class="btn secondario" id="aggiungi-p" style="margin-top:.5rem">Aggiungi un periodo</button></div>' +
      '<label style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="visibile" style="min-height:auto"' + (l.visibile !== false ? ' checked' : '') + '>Visibile nell\'app</label>' +
      '<div class="post-azioni"><button class="btn" type="submit">Salva</button><button class="btn secondario" type="button" id="annulla-l">Annulla</button>' + (l.id ? '<button class="btn secondario" type="button" id="elimina-l" style="color:var(--c-emergenze)">Elimina</button>' : '') + '</div>' +
      '<p id="l-msg" class="errore" role="alert"></p></form>';
    const f = $('f-l');
    f.scrollIntoView({ behavior: 'smooth' });
    if (!l.periodi.length) $('periodi').insertAdjacentHTML('beforeend', rigaPeriodo(null));
    $('aggiungi-p').onclick = function () { $('periodi').insertAdjacentHTML('beforeend', rigaPeriodo(null)); };
    f.addEventListener('click', function (e) { const b = e.target.closest('[data-togli-periodo]'); if (b) b.closest('[data-periodo]').remove(); });
    $('annulla-l').onclick = function () { $('form-l').innerHTML = ''; };
    if (l.id) $('elimina-l').onclick = function () {
      if (this.dataset.conferma !== '1') { this.dataset.conferma = '1'; this.textContent = 'Tocca di nuovo per eliminare'; return; }
      api('DELETE', 'locali/' + l.id).then(function () { toast('Eliminato'); tabAperture(); }).catch(errore);
    };
    f.onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(f);
      const periodi = Array.prototype.map.call(f.querySelectorAll('[data-periodo]'), function (p) {
        return { dal: p.querySelector('[name=dal]').value, al: p.querySelector('[name=al]').value, nota: p.querySelector('[name=nota]').value,
          giorni: Array.prototype.filter.call(p.querySelectorAll('[name=g]'), function (c) { return c.checked; }).map(function (c) { return Number(c.value); }) };
      });
      const body = { nome: fd.get('nome'), categoria: fd.get('categoria'), zona: fd.get('zona'), telefono: fd.get('telefono'), indirizzo: fd.get('indirizzo'), nota: fd.get('nota'), periodi: periodi, visibile: !!fd.get('visibile') };
      api(l.id ? 'PUT' : 'POST', 'locali' + (l.id ? '/' + l.id : ''), body).then(function () { toast('Salvato'); tabAperture(); }).catch(function (err) { $('l-msg').textContent = err.message; });
    };
  }

  function formImporta() {
    $('form-l').innerHTML = '<form class="scheda" id="f-imp"><h2 class="titolo-sez" style="margin-top:0">Importa un elenco</h2>' +
      '<p class="piccolo">Una riga per locale: <code>Nome; categoria; zona; periodi; nota</code>. Categorie: ' + Object.keys(CAT_LOCALI).join(', ') + '. Periodi separati da virgola, come <code>1/11-30/11, 8/12-6/1</code>.</p>' +
      '<p class="piccolo">Esempio: <code>Da Mario; ristorante; Spiaggia Grande; 1/11-6/1, 1/3-31/3; solo a pranzo</code></p>' +
      '<label>Anno di inizio della stagione<input type="number" name="anno" value="' + new Date().getFullYear() + '" min="2025" max="2035"></label>' +
      '<label>Elenco<textarea name="testo" rows="8" required></textarea></label>' +
      '<div class="post-azioni"><button class="btn" type="submit">Importa</button><button class="btn secondario" type="button" id="annulla-i">Annulla</button></div><div id="i-msg" class="errore" role="alert"></div></form>';
    $('annulla-i').onclick = function () { $('form-l').innerHTML = ''; };
    $('f-imp').onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      api('POST', 'locali/importa', { anno: Number(fd.get('anno')), testo: fd.get('testo') }).then(function (r) { toast('Importati ' + r.importati + ' locali'); tabAperture(); })
        .catch(function (err) { $('i-msg').innerHTML = esc(err.message) + (err.dati && err.dati.errori ? '<ul>' + err.dati.errori.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''); });
    };
  }

  function formStagione(st, zone) {
    $('form-l').innerHTML = '<form class="scheda" id="f-st"><h2 class="titolo-sez" style="margin-top:0">Stagione e zone</h2>' +
      '<div class="due"><label>Inizio della timeline<input type="date" name="dal" value="' + esc(st.dal || '') + '" required></label><label>Fine della timeline<input type="date" name="al" value="' + esc(st.al || '') + '" required></label>' +
      '<label>Calendario aggiornato al<input type="date" name="aggiornato" value="' + esc(st.aggiornato || oggi()) + '"></label></div>' +
      '<label>Titolo<input name="titolo" maxlength="80" value="' + esc(st.titolo && st.titolo.it || 'Aperti d\'inverno') + '"></label>' +
      '<label>Nota sotto il titolo<textarea name="nota" rows="3" maxlength="600">' + esc(st.nota && st.nota.it || '') + '</textarea></label>' +
      '<label>Ordine delle zone (una per riga, dall\'alto)<textarea name="zone" rows="6">' + esc(zone.join('\n')) + '</textarea></label>' +
      '<div class="post-azioni"><button class="btn" type="submit">Salva</button><button class="btn secondario" type="button" id="annulla-s">Annulla</button></div><p id="s-msg" class="errore" role="alert"></p></form>';
    $('annulla-s').onclick = function () { $('form-l').innerHTML = ''; };
    $('f-st').onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(this);
      api('PUT', 'config/stagione', { dal: fd.get('dal'), al: fd.get('al'), aggiornato: fd.get('aggiornato'), titolo: { it: fd.get('titolo'), en: (st.titolo && st.titolo.en) || 'Open in winter' },
        nota: { it: fd.get('nota'), en: (st.nota && st.nota.en) || '' }, zone: String(fd.get('zone')).split('\n').map(function (s) { return s.trim(); }).filter(Boolean) })
        .then(function () { toast('Salvato'); tabAperture(); }).catch(function (err) { $('s-msg').textContent = err.message; });
    };
  }

  /* ---------- avvisi ---------- */
  function tabAvvisi() {
    Promise.all([api('GET', 'avvisi'), api('GET', 'config')]).then(function (rr) {
      const lista = rr[0];
      dati.avvisi = lista; dati.config = rr[1];
      const o = oggi();
      let h = '<p class="note" style="margin-bottom:.8rem">Un avviso compare in home e nella pagina Avvisi dal giorno di inizio al giorno di fine, poi sparisce da solo. Quando cambia qualcosa, aggiorna lo stesso avviso: la storia resta visibile sotto.</p>' +
        '<div class="post-azioni" style="margin-bottom:1rem"><button class="btn" id="nuovo-a">Nuovo avviso</button></div><div id="form-a"></div><div class="elenco">';
      h += lista.length ? lista.map(function (a) {
        const attivo = a.dal <= o && a.al >= o && a.stato !== 'risolto';
        return '<div class="riga-l"><div><strong>' + esc(a.titolo_it) + '</strong> ' + (attivo ? '<span class="badge demo">in home</span>' : '') + (a.stato === 'risolto' ? '<span class="badge">risolto</span>' : '') +
          '<small>' + esc(CAT_AVVISI[a.categoria] || a.categoria) + ' · ' + dataIt(a.dal) + (a.al !== a.dal ? ' – ' + dataIt(a.al) : '') + '</small></div><button class="btn secondario" data-modifica-a="' + a.id + '">Modifica</button></div>';
      }).join('') : '<p class="note" style="padding:.8rem">Nessun avviso.</p>';
      $('tab').innerHTML = h + '</div>';
      $('nuovo-a').onclick = function () { formAvviso(null); };
      document.querySelectorAll('[data-modifica-a]').forEach(function (b) { b.onclick = function () { formAvviso(dati.avvisi.find(function (a) { return a.id === Number(b.getAttribute('data-modifica-a')); })); }; });
    }).catch(errore);
  }

  function formAvviso(a, dopo) {
    const o = oggi();
    a = a || { titolo_it: '', titolo_en: '', testo_it: '', testo_en: '', categoria: 'istituzionale', dal: o, al: o, stato: 'attivo', fonte_nome: 'Comune di Positano', fonte_url: '', priorita: 0, visibile: true, aggiornamenti: [] };
    const zone = (dati.config && dati.config.zone) || [], zoneA = a.zone || [];
    $('form-a').innerHTML = '<form class="scheda" id="f-a"><h2 class="titolo-sez" style="margin-top:0">' + (a.id ? 'Modifica avviso' : 'Nuovo avviso') + '</h2>' +
      '<label>Titolo<input name="titolo_it" required maxlength="140" value="' + esc(a.titolo_it) + '"></label>' +
      '<label>Testo<textarea name="testo_it" rows="3" maxlength="1200">' + esc(a.testo_it) + '</textarea></label>' +
      '<div class="due"><label>Categoria<select name="categoria">' + Object.keys(CAT_AVVISI).map(function (c) { return '<option value="' + c + '"' + (c === a.categoria ? ' selected' : '') + '>' + CAT_AVVISI[c] + '</option>'; }).join('') + '</select></label>' +
      '<label>Dal<input type="date" name="dal" required value="' + esc(a.dal) + '"></label><label>Al<input type="date" name="al" required value="' + esc(a.al) + '"></label>' +
      '<label>Stato<select name="stato">' + ['attivo', 'aggiornato', 'risolto'].map(function (s) { return '<option' + (s === a.stato ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="due"><label>Servizio interrotto<select name="servizio">' + Object.keys(SERVIZI).map(function (k) { return '<option value="' + k + '"' + ((a.servizio || '') === k ? ' selected' : '') + '>' + SERVIZI[k] + '</option>'; }).join('') + '</select></label></div>' +
      (zone.length ? '<fieldset class="zone-scelta"><legend>Zone interessate (nessuna = tutto il paese)</legend>' + zone.map(function (z) { return '<label><input type="checkbox" name="zone" value="' + esc(z) + '"' + (zoneA.indexOf(z) !== -1 ? ' checked' : '') + '>' + esc(z) + '</label>'; }).join('') + '</fieldset>' : '') +
      (a.ig_id ? '<input type="hidden" name="ig_id" value="' + esc(a.ig_id) + '">' : '') +
      (a.id ? '<label>Nota di aggiornamento (va nella storia)<input name="nota_aggiornamento" maxlength="300" placeholder="es. riaperta a senso unico alternato"></label>' : '') +
      '<details><summary style="cursor:pointer;font-weight:600;font-size:.88rem;min-height:32px">Inglese, fonte e opzioni</summary><div style="display:grid;gap:.6rem;margin-top:.6rem">' +
      '<p class="piccolo">Se lasci vuoto l\'inglese, alla pubblicazione viene tradotto in automatico (nell\'app è segnalato come traduzione automatica). <button type="button" class="btn secondario" id="traduci">Traduci ora</button></p>' +
      '<label>Titolo in inglese<input name="titolo_en" maxlength="140" value="' + esc(a.titolo_en || '') + '"></label>' +
      '<label>Testo in inglese<textarea name="testo_en" rows="2" maxlength="1200">' + esc(a.testo_en || '') + '</textarea></label>' +
      '<div class="due"><label>Fonte<input name="fonte_nome" maxlength="120" value="' + esc(a.fonte_nome || '') + '"></label><label>Link alla fonte (https://…)<input name="fonte_url" maxlength="500" value="' + esc(a.fonte_url || '') + '"></label></div>' +
      '<label style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="priorita" style="min-height:auto"' + (a.priorita ? ' checked' : '') + '>In cima agli altri</label>' +
      '<label style="flex-direction:row;align-items:center;gap:.5rem"><input type="checkbox" name="visibile" style="min-height:auto"' + (a.visibile !== false ? ' checked' : '') + '>Visibile nell\'app</label></div></details>' +
      '<div class="post-azioni"><button class="btn" type="submit">Pubblica</button><button class="btn secondario" type="button" id="annulla-a">Annulla</button>' + (a.id ? '<a class="btn secondario" href="./#post/d' + a.id + '">Crea il post</a><button class="btn secondario" type="button" id="elimina-a" style="color:var(--c-emergenze)">Elimina</button>' : '') + '</div>' +
      '<p id="av-msg" class="errore" role="alert"></p></form>';
    const f = $('f-a');
    f.scrollIntoView({ behavior: 'smooth' });
    $('annulla-a').onclick = function () { $('form-a').innerHTML = ''; };
    if (a.id) $('elimina-a').onclick = function () {
      if (this.dataset.conferma !== '1') { this.dataset.conferma = '1'; this.textContent = 'Tocca di nuovo per eliminare'; return; }
      api('DELETE', 'avvisi/' + a.id).then(function () { toast('Eliminato'); tabAvvisi(); }).catch(errore);
    };
    let tradotto = !!(a.tradotto_auto);
    $('traduci').onclick = function () {
      const b = this; b.disabled = true; b.textContent = 'Traduco…';
      api('POST', 'traduci', { titolo: f.titolo_it.value, testo: f.testo_it.value }).then(function (r) {
        if (r.titolo) f.titolo_en.value = r.titolo;
        if (r.testo) f.testo_en.value = r.testo;
        tradotto = true; toast('Tradotto: controlla e correggi se serve');
      }).catch(function (err) { toast(err.message); }).then(function () { b.disabled = false; b.textContent = 'Traduci ora'; });
    };
    f.onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(f);
      const body = {}; fd.forEach(function (v, k) { body[k] = v; });
      body.priorita = !!fd.get('priorita'); body.visibile = !!fd.get('visibile'); body.zone = fd.getAll('zone'); body.tradotto_auto = tradotto && !!(body.titolo_en);
      api(a.id ? 'PUT' : 'POST', 'avvisi' + (a.id ? '/' + a.id : ''), body).then(function () { toast('Pubblicato'); if (dopo) dopo(); else tabAvvisi(); }).catch(function (err) { $('av-msg').textContent = err.message; });
    };
  }

  /* ---------- home ---------- */
  function tabHome() {
    api('GET', 'config').then(function (c) {
      const hm = c.home || {};
      $('tab').innerHTML = '<form class="scheda" id="f-h"><p class="note">La home cambia da sola: Inverno da novembre a marzo, Natale dal 6 dicembre al 7 gennaio, Estate a metà giugno, Giorno di festa nelle feste grandi, Allerta con allerta meteo arancione o rossa. Qui puoi fissarne una a mano, per esempio durante un\'emergenza o un evento, e scrivere un messaggio che compare in cima.</p>' +
        '<label>Modalità della home<select name="forzata">' + Object.keys(MODI).map(function (m) { return '<option value="' + m + '"' + ((hm.forzata || '') === m ? ' selected' : '') + '>' + MODI[m] + '</option>'; }).join('') + '</select></label>' +
        '<label>Messaggio in cima alla home (vuoto = nessuno)<textarea name="msg" rows="3" maxlength="280">' + esc(hm.messaggio && hm.messaggio.it || '') + '</textarea></label>' +
        '<label>Lo stesso messaggio in inglese<textarea name="msg_en" rows="2" maxlength="280">' + esc(hm.messaggio && hm.messaggio.en || '') + '</textarea></label>' +
        '<div class="post-azioni"><button class="btn" type="submit">Salva</button><a class="btn secondario" href="./#home" target="_blank" rel="noopener">Guarda la home</a></div><p id="h-msg" class="errore" role="alert"></p></form>' +
        '<p class="note">Anteprime: ' + Object.keys(MODI).filter(Boolean).map(function (m) { return '<a href="./#home/' + m + '" target="_blank" rel="noopener">' + MODI[m] + '</a>'; }).join(' · ') + '</p>';
      $('f-h').onsubmit = function (e) {
        e.preventDefault();
        const fd = new FormData(this);
        const msg = String(fd.get('msg') || '').trim(), en = String(fd.get('msg_en') || '').trim();
        api('PUT', 'config/home', { forzata: fd.get('forzata') || null, messaggio: msg || en ? { it: msg, en: en } : null }).then(function () { toast('Salvato: la home cambia entro un minuto'); }).catch(function (err) { $('h-msg').textContent = err.message; });
      };
    }).catch(errore);
  }

  /* ---------- proposte dai post Instagram del Comune ---------- */
  function tabProposte() {
    Promise.all([api('GET', 'proposte'), api('GET', 'config')]).then(function (r) {
      const d = r[0]; dati.config = r[1]; dati.post = d.post;
      const nuovi = d.post.filter(function (p) { return !p.gestita; }), fatti = d.post.filter(function (p) { return p.gestita; });
      let h = '<p class="note" style="margin-bottom:.8rem">I post del Comune degli ultimi 45 giorni (da Super Agenda). Per ognuno: «Prepara l\'avviso» scrive una bozza ' +
        (d.ai ? 'con l\'intelligenza artificiale' : '(AI non disponibile ora: parte dal titolo del post)') + ', che controlli e pubblichi tu; oppure «Non serve».</p><div id="form-a"></div>';
      h += '<h2 class="titolo-sez">Da guardare · ' + nuovi.length + '</h2>' + (nuovi.length ? '<div class="proposte">' + nuovi.map(cardPost).join('') + '</div>' : '<p class="note">Niente di nuovo.</p>');
      if (fatti.length) h += '<details style="margin-top:1rem"><summary style="cursor:pointer;font-weight:600;min-height:44px">Già trattati · ' + fatti.length + '</summary><div class="elenco">' + fatti.map(function (p) {
        return '<div class="riga-l"><div><strong>' + esc(p.titolo || p.testo.slice(0, 80)) + '</strong><small>' + dataIt(p.quando.slice(0, 10)) + ' · ' + (p.gestita.esito === 'avviso' ? 'diventato avviso' : 'non serviva') + ' · ' + esc(p.gestita.chi) + '</small></div>' +
          '<button class="btn secondario" data-ripristina="' + esc(p.id) + '">Rimetti tra i nuovi</button></div>';
      }).join('') + '</div></details>';
      $('tab').innerHTML = h;
      document.querySelectorAll('[data-prepara]').forEach(function (b) { b.onclick = function () { prepara(b.getAttribute('data-prepara'), b); }; });
      document.querySelectorAll('[data-ignora]').forEach(function (b) { b.onclick = function () { api('POST', 'proposte/' + b.getAttribute('data-ignora') + '/ignora', {}).then(tabProposte).catch(errore); }; });
      document.querySelectorAll('[data-ripristina]').forEach(function (b) { b.onclick = function () { api('POST', 'proposte/' + b.getAttribute('data-ripristina') + '/ripristina', {}).then(tabProposte).catch(errore); }; });
    }).catch(errore);
  }
  function cardPost(p) {
    return '<article class="post-ig">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="' + esc(p.alt || '') + '" loading="lazy" width="120" height="150">' : '') +
      '<div><p class="piccolo">' + esc(new Date(p.quando).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'medium', timeStyle: 'short' })) + ' · <a href="' + esc(p.permalink) + '" target="_blank" rel="noopener">apri il post</a></p>' +
      '<strong>' + esc(p.titolo || '') + '</strong><p class="testo-ig">' + esc(p.testo.slice(0, 280)) + (p.testo.length > 280 ? '…' : '') + '</p>' +
      '<div class="post-azioni"><button class="btn" data-prepara="' + esc(p.id) + '">Prepara l\'avviso</button><button class="btn secondario" data-ignora="' + esc(p.id) + '">Non serve</button></div></div></article>';
  }
  function prepara(id, b) {
    const p = dati.post.find(function (x) { return x.id === id; });
    b.disabled = true; b.textContent = 'Preparo la bozza…';
    api('POST', 'proposte/' + id + '/prepara', { quando: p.quando, titolo: p.titolo, testo: p.testo, testo_immagine: p.testo_immagine }).then(function (z) {
      formAvviso(Object.assign({ stato: 'attivo', priorita: 0, visibile: true, aggiornamenti: [], fonte_nome: 'Instagram del Comune di Positano', fonte_url: p.permalink, ig_id: p.id }, z), tabProposte);
      $('f-a').insertAdjacentHTML('afterbegin', '<p class="callout">' + (z.ai ? 'Bozza scritta in automatico dal post: <strong>controlla date, zone e testo</strong> prima di pubblicare.' : 'Bozza dal titolo del post: completa testo e date.') + '</p>');
    }).catch(function (err) { toast(err.message); }).then(function () { b.disabled = false; b.textContent = 'Prepara l\'avviso'; });
  }

  /* ---------- notifiche ---------- */
  function tabNotifiche() {
    Promise.all([api('GET', 'notifiche'), api('GET', 'config')]).then(function (r) {
      const n = r[0], zone = r[1].zone || [];
      let h = '<p class="note" style="margin-bottom:.8rem">Le notifiche arrivano sul telefono di chi le ha attivate nell\'app (pagina «La tua zona e notifiche»). Usale poco: allerte, interruzioni, chiusure. Ogni invio finisce nel registro.</p>' +
        '<p><strong>' + n.iscritti + '</strong> telefoni iscritti' + (Object.keys(n.perZona).length ? ' · ' + Object.keys(n.perZona).map(function (z) { return esc(z) + ' ' + n.perZona[z]; }).join(' · ') : '') + '</p>' +
        '<form class="scheda" id="f-n"><label>Titolo<input name="titolo" required maxlength="80" placeholder="Acqua sospesa a Liparlati"></label>' +
        '<label>Testo<textarea name="testo" rows="2" maxlength="240" placeholder="Giovedì 5 dalle 9 alle 14 per lavori Ausino."></textarea></label>' +
        '<div class="due"><label>A chi<select name="zona"><option value="">Tutti gli iscritti</option>' + zone.map(function (z) { return '<option>' + esc(z) + '</option>'; }).join('') + '</select></label>' +
        '<label>Pagina da aprire<select name="url"><option value="#avvisi">Avvisi</option><option value="#home">Home</option><option value="#emergenze">Emergenze</option><option value="#muoversi">Muoversi</option><option value="#eventi">Eventi</option><option value="#consiglio">Consiglio comunale</option><option value="#albo">Albo</option></select></label></div>' +
        '<p class="piccolo">Con una zona scelta la ricevono gli iscritti di quella zona e chi non ha scelto zone.</p>' +
        '<div class="post-azioni"><button class="btn" type="submit">Invia</button></div><p id="n-msg" class="errore" role="alert"></p></form>';
      h += '<h2 class="titolo-sez">Ultimi invii</h2>' + (n.invii.length ? '<div class="elenco">' + n.invii.map(function (i) {
        return '<div class="riga-l"><div><strong>' + esc(i.titolo) + '</strong><small>' + esc(new Date(i.quando).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })) + ' · ' + esc(i.chi) + (i.zona ? ' · ' + esc(i.zona) : '') +
          ' · ' + i.ok + ' consegnate su ' + i.destinatari + (i.rimossi ? ' · ' + i.rimossi + ' iscrizioni scadute tolte' : '') + (i.finito ? '' : ' · <b>non finito</b>') + '</small></div>' + (i.finito ? '' : '<button class="btn secondario" data-riprendi="' + i.id + '">Completa</button>') + '</div>';
      }).join('') + '</div>' : '<p class="note">Nessun invio.</p>');
      $('tab').innerHTML = h;
      $('f-n').onsubmit = function (e) {
        e.preventDefault();
        const fd = new FormData(this), btn = this.querySelector('button[type=submit]');
        const body = { titolo: fd.get('titolo'), testo: fd.get('testo'), zona: fd.get('zona'), url: fd.get('url') };
        if (btn.dataset.conferma !== '1') { btn.dataset.conferma = '1'; btn.textContent = 'Conferma: invia ora'; return; }
        btn.disabled = true;
        api('POST', 'notifiche', body).then(function (r) { return inviaBlocchi(r.id, '', 0, btn); }).catch(function (err) { $('n-msg').textContent = err.message; btn.disabled = false; });
      };
      document.querySelectorAll('[data-riprendi]').forEach(function (b) { b.onclick = function () { b.disabled = true; inviaBlocchi(Number(b.getAttribute('data-riprendi')), '', 0, b); }; });
    }).catch(errore);
  }
  function inviaBlocchi(id, dopo, tot, btn) {
    return api('POST', 'notifiche/' + id + '/blocco', { dopo: dopo }).then(function (r) {
      tot += r.ok || 0;
      if (btn) btn.textContent = 'Inviate ' + tot + '…';
      if (r.fine) { toast('Notifica inviata a ' + tot + ' telefoni'); tabNotifiche(); return; }
      return inviaBlocchi(id, r.prossimo, tot, btn);
    }).catch(function (err) { toast(err.message + ': tocca «Completa» per riprendere'); tabNotifiche(); });
  }

  /* ---------- Consiglio, canali e zone ---------- */
  function tabComune() {
    api('GET', 'config').then(function (c) {
      dati.config = c;
      const cs = c.consiglio || {}, pr = cs.prossima || {}, ca = c.canali || {};
      $('tab').innerHTML = '<form class="scheda" id="f-cons"><h2 class="titolo-sez" style="margin-top:0">Prossimo Consiglio comunale</h2>' +
        '<p class="piccolo">Compare nella pagina Consiglio e, nei 14 giorni prima, anche in home. Le convocazioni e le delibere arrivano da sole dall\'Albo (tramite Super Agenda).</p>' +
        '<div class="due"><label>Data<input type="date" name="data" value="' + esc(pr.data || '') + '"></label><label>Ora<input type="time" name="ora" value="' + esc(pr.ora || '') + '"></label>' +
        '<label>Luogo<input name="luogo" maxlength="120" value="' + esc(pr.luogo || 'Sala consiliare «Andrea Milano»') + '"></label></div>' +
        '<label>Ordine del giorno (un punto per riga)<textarea name="odg" rows="5" maxlength="1500">' + esc(pr.odg || '') + '</textarea></label>' +
        '<div class="due"><label>Link alla convocazione (https://…)<input name="odg_url" maxlength="500" value="' + esc(pr.odg_url || '') + '"></label><label>Link della diretta (https://…)<input name="diretta_url" maxlength="500" value="' + esc(cs.diretta_url || '') + '"></label></div>' +
        '<label>Nota (facoltativa)<input name="nota" maxlength="300" value="' + esc(cs.nota || '') + '"></label>' +
        '<div class="post-azioni"><button class="btn" type="submit">Salva</button><button class="btn secondario" type="button" id="togli-seduta">Togli la seduta</button></div><p id="cons-msg" class="errore" role="alert"></p></form>' +
        '<form class="scheda" id="f-can"><h2 class="titolo-sez" style="margin-top:0">Canale WhatsApp del Comune</h2>' +
        '<label>Link del canale<input name="whatsapp" maxlength="200" value="' + esc(ca.whatsapp || '') + '" placeholder="https://whatsapp.com/channel/…"></label>' +
        '<label>Testo del riquadro (facoltativo)<input name="nome_whatsapp" maxlength="80" value="' + esc(ca.nome_whatsapp || '') + '" placeholder="Gli avvisi ufficiali, direttamente su WhatsApp"></label>' +
        '<div class="post-azioni"><button class="btn" type="submit">Salva</button></div><p id="can-msg" class="errore" role="alert"></p></form>' +
        '<form class="scheda" id="f-zone"><h2 class="titolo-sez" style="margin-top:0">Zone del paese</h2><p class="piccolo">Usate per gli avvisi e per le notifiche per zona. Una per riga. Cambiare un nome stacca gli iscritti da quella zona.</p>' +
        '<label>Zone<textarea name="zone" rows="8">' + esc((c.zone || []).join('\n')) + '</textarea></label><div class="post-azioni"><button class="btn" type="submit">Salva</button></div><p id="z-msg" class="errore" role="alert"></p></form>';
      const salvaCons = function (senzaSeduta) {
        const f = $('f-cons'), fd = new FormData(f);
        return api('PUT', 'config/consiglio', { prossima: senzaSeduta || !fd.get('data') ? null : { data: fd.get('data'), ora: fd.get('ora'), luogo: fd.get('luogo'), odg: fd.get('odg'), odg_url: fd.get('odg_url') },
          diretta_url: fd.get('diretta_url'), nota: fd.get('nota') }).then(function () { toast('Salvato'); tabComune(); }).catch(function (err) { $('cons-msg').textContent = err.message; });
      };
      $('f-cons').onsubmit = function (e) { e.preventDefault(); salvaCons(false); };
      $('togli-seduta').onclick = function () { salvaCons(true); };
      $('f-can').onsubmit = function (e) {
        e.preventDefault(); const fd = new FormData(this);
        api('PUT', 'config/canali', { whatsapp: fd.get('whatsapp'), nome_whatsapp: fd.get('nome_whatsapp') }).then(function () { toast('Salvato'); }).catch(function (err) { $('can-msg').textContent = err.message; });
      };
      $('f-zone').onsubmit = function (e) {
        e.preventDefault(); const fd = new FormData(this);
        api('PUT', 'config/zone', { zone: String(fd.get('zone')).split('\n').map(function (s) { return s.trim(); }).filter(Boolean) }).then(function () { toast('Salvato'); }).catch(function (err) { $('z-msg').textContent = err.message; });
      };
    }).catch(errore);
  }

  /* ---------- stato: statistiche, errori, collegamenti ---------- */
  function tabStato() {
    api('GET', 'stato').then(function (s) {
      const tot = s.giorni.reduce(function (n, g) { return n + g.n; }, 0), max = Math.max.apply(null, s.giorni.map(function (g) { return g.n; }).concat([1]));
      let h = '<p class="note" style="margin-bottom:.8rem">Contatori anonimi degli ultimi 30 giorni: quante volte è stata aperta ogni pagina. Nessun cookie, nessun indirizzo IP, nessun identificativo.</p>';
      h += '<div class="due"><div class="scheda"><strong>' + tot + '</strong> pagine aperte<br><span class="piccolo">' + s.lingue.map(function (l) { return (l.lingua === 'en' ? 'inglese ' : 'italiano ') + l.n; }).join(' · ') + '</span></div>' +
        '<div class="scheda"><strong>' + s.iscritti + '</strong> iscritti alle notifiche</div>' +
        '<div class="scheda">Super Agenda: ' + (s.superagenda ? 'letto ' + esc(new Date(s.superagenda.letto).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })) + ' · ' + s.superagenda.albo + ' atti, ' + s.superagenda.feste + ' feste' : 'mai letto') +
        '<br><button class="btn secondario" id="sa-ora" style="margin-top:.4rem">Aggiorna ora</button></div>' +
        '<div class="scheda">Intelligenza artificiale: ' + (s.ai ? 'disponibile' : 'non disponibile') + '</div></div>';
      if (s.giorni.length) h += '<h2 class="titolo-sez">Per giorno</h2><div class="barre">' + s.giorni.map(function (g) { return '<div title="' + esc(g.giorno) + ': ' + g.n + '"><i style="height:' + Math.round(g.n / max * 100) + '%"></i><span>' + Number(g.giorno.slice(8)) + '</span></div>'; }).join('') + '</div>';
      if (s.sezioni.length) h += '<h2 class="titolo-sez">Per pagina</h2><div class="tabella"><table class="registro" style="border-collapse:collapse;width:100%"><tbody>' + s.sezioni.map(function (x) { return '<tr><td>' + esc(x.sezione) + '</td><td style="text-align:right">' + x.n + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<h2 class="titolo-sez">Errori dai telefoni</h2>' + (s.errori.length ? '<div class="tabella"><table class="registro" style="border-collapse:collapse;width:100%"><tbody>' + s.errori.map(function (e) {
        return '<tr><td>' + esc(new Date(e.ultimo).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })) + '</td><td>' + e.volte + '×</td><td>' + esc(e.messaggio) + '<br><small>' + esc(e.dove || '') + ' · v' + esc(e.versione || '') + '</small></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="note">Nessun errore registrato.</p>');
      $('tab').innerHTML = h;
      $('sa-ora').onclick = function () {
        const b = this; b.disabled = true; b.textContent = 'Aggiorno…';
        api('POST', 'superagenda/aggiorna', {}).then(function (r) { toast('Aggiornato: ' + r.albo + ' atti, ' + r.feste + ' feste, ' + r.spiegati + ' spiegazioni nuove'); tabStato(); }).catch(function (err) { toast(err.message); b.disabled = false; b.textContent = 'Aggiorna ora'; });
      };
    }).catch(errore);
  }

  /* ---------- registro ---------- */
  function tabRegistro() {
    api('GET', 'registro').then(function (r) {
      $('tab').innerHTML = '<p class="note" style="margin-bottom:.6rem">Le ultime 100 modifiche. Il registro conserva anche il prima e il dopo di ogni modifica.</p><div class="tabella"><table class="registro" style="border-collapse:collapse;width:100%"><tbody>' +
        r.map(function (x) { return '<tr><td>' + esc(new Date(x.quando).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })) + '</td><td>' + esc(x.chi) + '</td><td>' + esc(x.azione) + '</td><td>' + esc(x.oggetto || '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }).catch(errore);
  }

  function errore(err) {
    if (err.status === 401) return mostra('accesso');
    $('tab').innerHTML = '<p class="errore">' + esc(err.message) + '</p>';
  }

  avvio();
})();
