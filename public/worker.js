/* Positano.app · Worker: serve l'app statica e le API del pannello di redazione.
   - Lettura pubblica: /api/pubblico (aperture invernali, avvisi, impostazioni della home).
   - Scrittura solo dal pannello (/admin.html), con accesso protetto da password e cookie firmato.
   - Ogni modifica finisce nel registro (chi, cosa, quando, prima e dopo).
   Nessun dato personale dei visitatori: niente cookie per chi legge l'app, niente statistiche. */

const SESSIONE_ORE = 12;
const TENTATIVI_MAX = 8;          // per 15 minuti, per indirizzo
const CATEGORIE_LOCALI = ['ristorante', 'bar', 'pizzeria', 'alimentari', 'pasticceria', 'albergo', 'negozio', 'servizi'];
const CATEGORIE_AVVISI = ['emergenze', 'viabilita', 'cultura', 'sanita', 'sport', 'ambiente', 'turismo', 'scuole', 'lavori', 'sociale', 'oggi', 'comunicati', 'istituzionale', 'protezione-civile'];
const MODALITA = ['ordinaria', 'estate', 'inverno', 'natale', 'festa', 'allerta'];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      return await api(req, env, url);
    } catch (e) {
      if (e instanceof Risposta) return e.res;
      console.error(e);
      return json({ errore: 'Errore interno' }, 500);
    }
  }
};

class Risposta { constructor(res) { this.res = res; } }
function fail(msg, status) { throw new Risposta(json({ errore: msg }, status || 400)); }

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, headers || {})
  });
}

const ora = () => new Date().toISOString();
const ISO = /^\d{4}-\d{2}-\d{2}$/;

async function api(req, env, url) {
  const p = url.pathname, m = req.method;

  if (p === '/api/pubblico' && m === 'GET') return pubblico(env);

  // Da qui in giù solo richieste del pannello: stessa origine, JSON, intestazione esplicita (difesa CSRF).
  if (m !== 'GET') {
    if (req.headers.get('x-pannello') !== '1') fail('Richiesta non valida', 403);
    const orig = req.headers.get('origin');
    if (orig && orig !== url.origin) fail('Origine non valida', 403);
  }

  if (p === '/api/accesso' && m === 'POST') return accesso(req, env);
  if (p === '/api/esci' && m === 'POST') return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });

  const utente = await chiSei(req, env);
  if (!utente) fail('Accesso richiesto', 401);

  if (p === '/api/io' && m === 'GET') return json({ email: utente.email, nome: utente.nome, ruolo: utente.ruolo, cambiare_password: !!utente.cambiare_password });
  if (p === '/api/password' && m === 'POST') return cambiaPassword(req, env, utente);

  if (utente.cambiare_password) fail('Prima cambia la password', 403);

  if (p === '/api/locali' && m === 'GET') return json((await env.DB.prepare('SELECT * FROM locali ORDER BY nome COLLATE NOCASE').all()).results.map(locale));
  if (p === '/api/locali' && m === 'POST') return salvaLocale(req, env, utente, null);
  if (p === '/api/locali/importa' && m === 'POST') return importaLocali(req, env, utente);
  let r = p.match(/^\/api\/locali\/(\d+)$/);
  if (r && m === 'PUT') return salvaLocale(req, env, utente, Number(r[1]));
  if (r && m === 'DELETE') return elimina(env, utente, 'locali', Number(r[1]));

  if (p === '/api/avvisi' && m === 'GET') return json((await env.DB.prepare('SELECT * FROM avvisi ORDER BY al DESC, id DESC LIMIT 200').all()).results.map(avviso));
  if (p === '/api/avvisi' && m === 'POST') return salvaAvviso(req, env, utente, null);
  r = p.match(/^\/api\/avvisi\/(\d+)$/);
  if (r && m === 'PUT') return salvaAvviso(req, env, utente, Number(r[1]));
  if (r && m === 'DELETE') return elimina(env, utente, 'avvisi', Number(r[1]));

  if (p === '/api/config' && m === 'GET') return json({ stagione: await leggiConfig(env, 'stagione'), home: await leggiConfig(env, 'home') });
  r = p.match(/^\/api\/config\/(stagione|home)$/);
  if (r && m === 'PUT') return salvaConfig(req, env, utente, r[1]);

  if (p === '/api/registro' && m === 'GET') return json((await env.DB.prepare('SELECT id, quando, chi, azione, oggetto FROM registro ORDER BY id DESC LIMIT 100').all()).results);

  fail('Non trovato', 404);
}

/* ---------- lettura pubblica ---------- */
async function pubblico(env) {
  const [locali, avvisi, stagione, home] = await Promise.all([
    env.DB.prepare('SELECT id, nome, categoria, zona, indirizzo, telefono, nota, periodi, aggiornato FROM locali WHERE visibile = 1 ORDER BY nome COLLATE NOCASE').all(),
    env.DB.prepare("SELECT * FROM avvisi WHERE visibile = 1 AND al >= date('now', '-30 day') ORDER BY priorita DESC, dal DESC").all(),
    leggiConfig(env, 'stagione'),
    leggiConfig(env, 'home')
  ]);
  return json({
    generato: ora(),
    aperture: { stagione: stagione, locali: locali.results.map(locale) },
    avvisi: avvisi.results.map(avvisoPubblico),
    home: home
  }, 200, { 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*' });
}

function locale(r) { return Object.assign({}, r, { periodi: parse(r.periodi, []), visibile: r.visibile === undefined ? undefined : !!r.visibile }); }
function avviso(r) { return Object.assign({}, r, { aggiornamenti: parse(r.aggiornamenti, []), visibile: !!r.visibile }); }
function avvisoPubblico(r) {
  return {
    id: 'd' + r.id, titolo: { it: r.titolo_it, en: r.titolo_en || '' }, testo: { it: r.testo_it || '', en: r.testo_en || '' },
    categoria: r.categoria, dal: r.dal, al: r.al, stato: r.stato, aggiornamenti: parse(r.aggiornamenti, []),
    fonte: r.fonte_nome ? { nome: r.fonte_nome, url: r.fonte_url || undefined } : undefined, priorita: r.priorita, aggiornato: r.aggiornato
  };
}
function parse(s, d) { try { return JSON.parse(s); } catch (e) { return d; } }

async function leggiConfig(env, k) {
  const r = await env.DB.prepare('SELECT valore FROM config WHERE chiave = ?').bind(k).first();
  return r ? parse(r.valore, null) : null;
}

/* ---------- accesso ---------- */
async function accesso(req, env) {
  const body = await leggiJSON(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  const chiave = await sha256(ip + '|' + email);
  const adesso = Date.now();
  await env.DB.prepare('DELETE FROM tentativi WHERE quando < ?').bind(adesso - 15 * 60 * 1000).run();
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM tentativi WHERE chiave = ?').bind(chiave).first();
  if (n && n.n >= TENTATIVI_MAX) fail('Troppi tentativi: riprova fra 15 minuti', 429);

  const u = await env.DB.prepare('SELECT * FROM utenti WHERE email = ?').bind(email).first();
  const ok = u && await verificaPassword(password, u.sale, u.hash);
  if (!ok) {
    await env.DB.prepare('INSERT INTO tentativi (chiave, quando) VALUES (?, ?)').bind(chiave, adesso).run();
    fail('Email o password non corrette', 401);
  }
  await env.DB.prepare('DELETE FROM tentativi WHERE chiave = ?').bind(chiave).run();
  const scade = adesso + SESSIONE_ORE * 3600 * 1000;
  const token = await firma(env, email + '|' + scade);
  return json({ ok: true, cambiare_password: !!u.cambiare_password }, 200, { 'set-cookie': cookie(token, SESSIONE_ORE * 3600) });
}

function cookie(v, maxAge) {
  return 'pa_sess=' + v + '; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=' + maxAge;
}

async function chiSei(req, env) {
  const c = (req.headers.get('cookie') || '').match(/(?:^|;\s*)pa_sess=([^;]+)/);
  if (!c) return null;
  const parti = c[1].split('.');
  if (parti.length !== 2) return null;
  const dati = atobUrl(parti[0]);
  if (!dati) return null;
  const atteso = await firma(env, dati);
  if (atteso !== c[1]) return null;
  const [email, scade] = dati.split('|');
  if (Number(scade) < Date.now()) return null;
  return env.DB.prepare('SELECT email, nome, ruolo, cambiare_password FROM utenti WHERE email = ?').bind(email).first();
}

async function chiaveSessione(env) {
  let r = await env.DB.prepare("SELECT valore FROM config WHERE chiave = 'chiave_sessione'").first();
  if (!r) {
    const k = hex(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare("INSERT OR IGNORE INTO config (chiave, valore) VALUES ('chiave_sessione', ?)").bind(k).run();
    r = await env.DB.prepare("SELECT valore FROM config WHERE chiave = 'chiave_sessione'").first();
  }
  return r.valore;
}

async function firma(env, dati) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(await chiaveSessione(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dati));
  return btoaUrl(dati) + '.' + hex(new Uint8Array(sig));
}

async function hashPassword(password, saleHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saleHex), iterations: 100000 }, key, 256);
  return hex(new Uint8Array(bits));
}
async function verificaPassword(pw, sale, hash) { return (await hashPassword(pw, sale)) === hash; }

async function cambiaPassword(req, env, u) {
  const b = await leggiJSON(req);
  const nuova = String(b.nuova || '');
  if (nuova.length < 12) fail('La password deve avere almeno 12 caratteri');
  const rec = await env.DB.prepare('SELECT sale, hash FROM utenti WHERE email = ?').bind(u.email).first();
  if (!(await verificaPassword(String(b.attuale || ''), rec.sale, rec.hash))) fail('Password attuale non corretta', 401);
  const sale = hex(crypto.getRandomValues(new Uint8Array(16)));
  await env.DB.prepare('UPDATE utenti SET sale = ?, hash = ?, cambiare_password = 0 WHERE email = ?').bind(sale, await hashPassword(nuova, sale), u.email).run();
  await registra(env, u, 'password', 'utente ' + u.email, null, null);
  return json({ ok: true });
}

/* ---------- scrittura ---------- */
async function leggiJSON(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) fail('Serve JSON', 415);
  const t = await req.text();
  if (t.length > 200000) fail('Richiesta troppo grande', 413);
  try { return JSON.parse(t || '{}'); } catch (e) { fail('JSON non valido'); }
}

function testo(v, max) { const s = String(v == null ? '' : v).trim(); if (s.length > max) fail('Testo troppo lungo (massimo ' + max + ' caratteri)'); return s; }
function urlSicuro(v) { const s = testo(v, 500); if (s && !/^https:\/\//.test(s)) fail('I link devono iniziare con https://'); return s; }

function pulisciPeriodi(arr) {
  if (!Array.isArray(arr)) fail('Periodi non validi');
  if (arr.length > 40) fail('Troppi periodi');
  return arr.map(function (x) {
    if (!ISO.test(x.dal || '') || !ISO.test(x.al || '')) fail('Ogni periodo ha bisogno di una data di inizio e di fine');
    if (x.al < x.dal) fail('Un periodo finisce prima di cominciare: ' + x.dal + ' → ' + x.al);
    const giorni = Array.isArray(x.giorni) ? x.giorni.map(Number).filter(function (g) { return g >= 0 && g <= 6; }) : [];
    return { dal: x.dal, al: x.al, giorni: giorni.length && giorni.length < 7 ? giorni : undefined, nota: testo(x.nota, 120) || undefined };
  }).sort(function (a, b) { return a.dal.localeCompare(b.dal); });
}

async function salvaLocale(req, env, u, id) {
  const b = await leggiJSON(req);
  const v = {
    nome: testo(b.nome, 80), categoria: String(b.categoria || ''), zona: testo(b.zona, 60), indirizzo: testo(b.indirizzo, 120),
    telefono: testo(b.telefono, 30), nota: testo(b.nota, 300), periodi: JSON.stringify(pulisciPeriodi(b.periodi || [])), visibile: b.visibile === false ? 0 : 1
  };
  if (!v.nome) fail('Il nome è obbligatorio');
  if (CATEGORIE_LOCALI.indexOf(v.categoria) === -1) fail('Categoria non valida');
  const adesso = ora();
  if (id) {
    const prima = await env.DB.prepare('SELECT * FROM locali WHERE id = ?').bind(id).first();
    if (!prima) fail('Locale non trovato', 404);
    await env.DB.prepare('UPDATE locali SET nome=?, categoria=?, zona=?, indirizzo=?, telefono=?, nota=?, periodi=?, visibile=?, aggiornato=?, aggiornato_da=? WHERE id=?')
      .bind(v.nome, v.categoria, v.zona, v.indirizzo, v.telefono, v.nota, v.periodi, v.visibile, adesso, u.email, id).run();
    await registra(env, u, 'modifica', 'locale ' + id + ' ' + v.nome, prima, v);
  } else {
    const r = await env.DB.prepare('INSERT INTO locali (nome, categoria, zona, indirizzo, telefono, nota, periodi, visibile, creato, aggiornato, aggiornato_da) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(v.nome, v.categoria, v.zona, v.indirizzo, v.telefono, v.nota, v.periodi, v.visibile, adesso, adesso, u.email).run();
    id = r.meta.last_row_id;
    await registra(env, u, 'nuovo', 'locale ' + id + ' ' + v.nome, null, v);
  }
  return json(locale(await env.DB.prepare('SELECT * FROM locali WHERE id = ?').bind(id).first()));
}

/* Importazione in blocco: una riga per locale, «Nome; categoria; zona; 1/11-30/11, 8/12-6/1; nota». */
async function importaLocali(req, env, u) {
  const b = await leggiJSON(req);
  const anno = Number(b.anno) || new Date().getUTCFullYear();
  const righe = String(b.testo || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (righe.length > 300) fail('Al massimo 300 righe per volta');
  const errori = [], nuovi = [];
  righe.forEach(function (riga, i) {
    const c = riga.split(';').map(function (s) { return s.trim(); });
    const cat = (c[1] || '').toLowerCase();
    if (!c[0] || CATEGORIE_LOCALI.indexOf(cat) === -1) { errori.push('Riga ' + (i + 1) + ': nome o categoria mancanti'); return; }
    const periodi = [];
    (c[3] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (int) {
      const mm = int.match(/^(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})$/);
      if (!mm) { errori.push('Riga ' + (i + 1) + ': periodo «' + int + '» non capito (scrivi 1/11-30/11)'); return; }
      const m1 = Number(mm[2]), m2 = Number(mm[4]);
      const y1 = m1 >= 7 ? anno : anno + 1, y2 = m2 >= 7 ? anno : anno + 1;
      const d = function (y, m, g) { return y + '-' + String(m).padStart(2, '0') + '-' + String(g).padStart(2, '0'); };
      periodi.push({ dal: d(y1, m1, Number(mm[1])), al: d(y2, m2, Number(mm[3])) });
    });
    nuovi.push({ nome: c[0], categoria: cat, zona: c[2] || '', nota: c[4] || '', periodi: periodi });
  });
  if (errori.length) return json({ ok: false, errori: errori }, 400);
  const adesso = ora();
  for (const v of nuovi) {
    const per = JSON.stringify(pulisciPeriodi(v.periodi));
    await env.DB.prepare('INSERT INTO locali (nome, categoria, zona, nota, periodi, visibile, creato, aggiornato, aggiornato_da) VALUES (?,?,?,?,?,1,?,?,?)')
      .bind(testo(v.nome, 80), v.categoria, testo(v.zona, 60), testo(v.nota, 300), per, adesso, adesso, u.email).run();
  }
  await registra(env, u, 'importa', nuovi.length + ' locali', null, null);
  return json({ ok: true, importati: nuovi.length });
}

async function salvaAvviso(req, env, u, id) {
  const b = await leggiJSON(req);
  const v = {
    titolo_it: testo(b.titolo_it, 140), titolo_en: testo(b.titolo_en, 140), testo_it: testo(b.testo_it, 1200), testo_en: testo(b.testo_en, 1200),
    categoria: String(b.categoria || ''), dal: String(b.dal || ''), al: String(b.al || ''), stato: String(b.stato || 'attivo'),
    fonte_nome: testo(b.fonte_nome, 120), fonte_url: urlSicuro(b.fonte_url), priorita: b.priorita ? 1 : 0, visibile: b.visibile === false ? 0 : 1
  };
  if (!v.titolo_it) fail('Il titolo è obbligatorio');
  if (CATEGORIE_AVVISI.indexOf(v.categoria) === -1) fail('Categoria non valida');
  if (!ISO.test(v.dal) || !ISO.test(v.al) || v.al < v.dal) fail('Controlla le date: dal e al');
  if (['attivo', 'aggiornato', 'risolto'].indexOf(v.stato) === -1) fail('Stato non valido');
  const adesso = ora();
  let agg = [];
  if (id) {
    const prima = await env.DB.prepare('SELECT * FROM avvisi WHERE id = ?').bind(id).first();
    if (!prima) fail('Avviso non trovato', 404);
    agg = parse(prima.aggiornamenti, []);
    const nota = testo(b.nota_aggiornamento, 300);
    if (nota) agg.push({ quando: adesso, testo: nota, stato: v.stato });
    if (agg.length > 50) agg = agg.slice(-50);
    await env.DB.prepare('UPDATE avvisi SET titolo_it=?, titolo_en=?, testo_it=?, testo_en=?, categoria=?, dal=?, al=?, stato=?, aggiornamenti=?, fonte_nome=?, fonte_url=?, priorita=?, visibile=?, aggiornato=?, aggiornato_da=? WHERE id=?')
      .bind(v.titolo_it, v.titolo_en, v.testo_it, v.testo_en, v.categoria, v.dal, v.al, v.stato, JSON.stringify(agg), v.fonte_nome, v.fonte_url, v.priorita, v.visibile, adesso, u.email, id).run();
    await registra(env, u, 'modifica', 'avviso ' + id + ' ' + v.titolo_it, prima, v);
  } else {
    const r = await env.DB.prepare('INSERT INTO avvisi (titolo_it, titolo_en, testo_it, testo_en, categoria, dal, al, stato, aggiornamenti, fonte_nome, fonte_url, priorita, visibile, creato, aggiornato, aggiornato_da) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(v.titolo_it, v.titolo_en, v.testo_it, v.testo_en, v.categoria, v.dal, v.al, v.stato, '[]', v.fonte_nome, v.fonte_url, v.priorita, v.visibile, adesso, adesso, u.email).run();
    id = r.meta.last_row_id;
    await registra(env, u, 'nuovo', 'avviso ' + id + ' ' + v.titolo_it, null, v);
  }
  return json(avviso(await env.DB.prepare('SELECT * FROM avvisi WHERE id = ?').bind(id).first()));
}

async function salvaConfig(req, env, u, chiave) {
  const b = await leggiJSON(req);
  let v;
  if (chiave === 'home') {
    const forzata = b.forzata ? String(b.forzata) : null;
    if (forzata && MODALITA.indexOf(forzata) === -1) fail('Modalità non valida');
    v = { forzata: forzata, messaggio: b.messaggio && (b.messaggio.it || b.messaggio.en) ? { it: testo(b.messaggio.it, 280), en: testo(b.messaggio.en, 280) } : null };
  } else {
    if (!ISO.test(b.dal || '') || !ISO.test(b.al || '') || b.al < b.dal) fail('Controlla le date della stagione');
    v = { titolo: { it: testo(b.titolo && b.titolo.it, 80), en: testo(b.titolo && b.titolo.en, 80) }, dal: b.dal, al: b.al,
      aggiornato: ISO.test(b.aggiornato || '') ? b.aggiornato : ora().slice(0, 10), nota: { it: testo(b.nota && b.nota.it, 600), en: testo(b.nota && b.nota.en, 600) },
      zone: (Array.isArray(b.zone) ? b.zone : []).map(function (z) { return testo(z, 60); }).filter(Boolean).slice(0, 30) };
  }
  const prima = await leggiConfig(env, chiave);
  await env.DB.prepare('INSERT INTO config (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore').bind(chiave, JSON.stringify(v)).run();
  await registra(env, u, 'impostazioni', chiave, prima, v);
  return json(v);
}

async function elimina(env, u, tabella, id) {
  const prima = await env.DB.prepare('SELECT * FROM ' + tabella + ' WHERE id = ?').bind(id).first();
  if (!prima) fail('Non trovato', 404);
  await env.DB.prepare('DELETE FROM ' + tabella + ' WHERE id = ?').bind(id).run();
  await registra(env, u, 'elimina', tabella + ' ' + id, prima, null);
  return json({ ok: true });
}

async function registra(env, u, azione, oggetto, prima, dopo) {
  await env.DB.prepare('INSERT INTO registro (quando, chi, azione, oggetto, prima, dopo) VALUES (?,?,?,?,?,?)')
    .bind(ora(), u.email, azione, oggetto, prima ? JSON.stringify(prima) : null, dopo ? JSON.stringify(dopo) : null).run();
}

/* ---------- utilità ---------- */
function hex(a) { return Array.from(a, function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
function unhex(s) { const a = new Uint8Array(s.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(s.substr(i * 2, 2), 16); return a; }
async function sha256(s) { return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))); }
function btoaUrl(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function atobUrl(s) { try { return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { return null; } }
