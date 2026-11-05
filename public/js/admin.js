/* Positano.app · pannello di redazione. Parla solo con /api/* dello stesso sito. */
(function () {
  'use strict';
  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  const CAT_LOCALI = { ristorante: 'Ristorante', bar: 'Bar', pizzeria: 'Pizzeria', alimentari: 'Alimentari', pasticceria: 'Pasticceria', albergo: 'Albergo', negozio: 'Negozio', servizi: 'Servizi' };
  const CAT_AVVISI = { istituzionale: 'Avviso ai cittadini', emergenze: 'Emergenze', 'protezione-civile': 'Protezione civile', viabilita: 'Viabilità', ambiente: 'Ambiente, acqua, rifiuti', lavori: 'Lavori pubblici', sanita: 'Sanità', sociale: 'Sociale', scuole: 'Scuole', cultura: 'Cultura ed eventi', sport: 'Sport', turismo: 'Turismo', oggi: 'Oggi a Positano', comunicati: 'Servizi' };
  const MODI = { '': 'Automatica (secondo data e allerte)', ordinaria: 'Ordinaria', inverno: 'Inverno', natale: 'Natale', estate: 'Estate', festa: 'Giorno di festa', allerta: 'Allerta' };
  const GIORNI = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
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
    ({ aperture: tabAperture, avvisi: tabAvvisi, home: tabHome, registro: tabRegistro })[id]();
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
    api('GET', 'avvisi').then(function (lista) {
      dati.avvisi = lista;
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

  function formAvviso(a) {
    const o = oggi();
    a = a || { titolo_it: '', titolo_en: '', testo_it: '', testo_en: '', categoria: 'istituzionale', dal: o, al: o, stato: 'attivo', fonte_nome: 'Comune di Positano', fonte_url: '', priorita: 0, visibile: true, aggiornamenti: [] };
    $('form-a').innerHTML = '<form class="scheda" id="f-a"><h2 class="titolo-sez" style="margin-top:0">' + (a.id ? 'Modifica avviso' : 'Nuovo avviso') + '</h2>' +
      '<label>Titolo<input name="titolo_it" required maxlength="140" value="' + esc(a.titolo_it) + '"></label>' +
      '<label>Testo<textarea name="testo_it" rows="3" maxlength="1200">' + esc(a.testo_it) + '</textarea></label>' +
      '<div class="due"><label>Categoria<select name="categoria">' + Object.keys(CAT_AVVISI).map(function (c) { return '<option value="' + c + '"' + (c === a.categoria ? ' selected' : '') + '>' + CAT_AVVISI[c] + '</option>'; }).join('') + '</select></label>' +
      '<label>Dal<input type="date" name="dal" required value="' + esc(a.dal) + '"></label><label>Al<input type="date" name="al" required value="' + esc(a.al) + '"></label>' +
      '<label>Stato<select name="stato">' + ['attivo', 'aggiornato', 'risolto'].map(function (s) { return '<option' + (s === a.stato ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label></div>' +
      (a.id ? '<label>Nota di aggiornamento (va nella storia)<input name="nota_aggiornamento" maxlength="300" placeholder="es. riaperta a senso unico alternato"></label>' : '') +
      '<details><summary style="cursor:pointer;font-weight:600;font-size:.88rem;min-height:32px">Inglese, fonte e opzioni</summary><div style="display:grid;gap:.6rem;margin-top:.6rem">' +
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
    f.onsubmit = function (e) {
      e.preventDefault();
      const fd = new FormData(f);
      const body = {}; fd.forEach(function (v, k) { body[k] = v; });
      body.priorita = !!fd.get('priorita'); body.visibile = !!fd.get('visibile');
      api(a.id ? 'PUT' : 'POST', 'avvisi' + (a.id ? '/' + a.id : ''), body).then(function () { toast('Pubblicato'); tabAvvisi(); }).catch(function (err) { $('av-msg').textContent = err.message; });
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
