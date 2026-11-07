/* Positano.app · calendari pubblici collegati con un semplice link .ics (Google Calendar, Outlook, Nextcloud…).
   I link si mettono e si cambiano dal pannello (Consiglio e canali): nessun legame con un fornitore o un account.
   Il Worker li legge ogni 2 ore e conserva solo titolo, date e luogo degli eventi. */

function sfuggi(s) { return String(s || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim(); }

/* Data ICS → AAAA-MM-GG nell'ora di Roma. Valori: 20261125 · 20261124T230000Z · 20261125T180000 (ora locale) */
function giorno(v) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/.exec(String(v || ''));
  if (!m) return null;
  if (!m[4] || !m[7]) return m[1] + '-' + m[2] + '-' + m[3];
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = function (t) { return p.find(function (x) { return x.type === t; }).value; };
  return g('year') + '-' + g('month') + '-' + g('day');
}
function meno1(iso) { const a = iso.split('-').map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2] - 1)).toISOString().slice(0, 10); }

function giorni(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); }
function sposta(iso, freq, n) {
  const a = iso.split('-').map(Number);
  let d;
  if (freq === 'DAILY') d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n));
  else if (freq === 'WEEKLY') d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + 7 * n));
  else if (freq === 'MONTHLY') d = new Date(Date.UTC(a[0], a[1] - 1 + n, a[2]));
  else d = new Date(Date.UTC(a[0] + n, a[1] - 1, a[2]));
  // 31 del mese o 29 febbraio che non esistono: l'occorrenza si salta (RFC 5545)
  if (d.getUTCDate() !== a[2] && freq !== 'DAILY' && freq !== 'WEEKLY') return null;
  return d.toISOString().slice(0, 10);
}

/* Ricorrenze semplici (ogni giorno/settimana/mese/anno, con INTERVAL, COUNT, UNTIL, EXDATE).
   Regole con BYDAY, BYMONTHDAY ecc. non si espandono: resta la prima data. */
function espandi(ev, da, a, salta) {
  const r = {};
  String(ev.rrule).split(';').forEach(function (p) { const i = p.indexOf('='); if (i > 0) r[p.slice(0, i).toUpperCase()] = p.slice(i + 1); });
  const freq = r.FREQ;
  if (!/^(DAILY|WEEKLY|MONTHLY|YEARLY)$/.test(freq) || Object.keys(r).some(function (k) { return /^BY/.test(k); })) return [ev.inizio];
  const passo = Math.max(1, parseInt(r.INTERVAL, 10) || 1), quante = parseInt(r.COUNT, 10) || Infinity, fino = r.UNTIL ? giorno(r.UNTIL) : null;
  const durata = Math.max(0, giorni(ev.inizio, ev.fine));
  const out = [];
  for (let n = 0, fatte = 0; n < 2000 && fatte < quante; n++) {
    const g = sposta(ev.inizio, freq, n * passo);
    if (!g) continue;
    if ((fino && g > fino) || g > a) break;
    fatte++;
    if (salta.has(g)) continue;
    if (sposta(g, 'DAILY', durata) >= da) out.push(g);
  }
  return out;
}

/* da/a (AAAA-MM-GG, facoltativi): finestra in cui espandere gli eventi ricorrenti. */
export function leggiIcs(testo, nome, da, a) {
  const righe = String(testo).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const grezzi = [];
  let ev = null;
  righe.forEach(function (r) {
    if (r === 'BEGIN:VEVENT') { ev = { exdate: [] }; return; }
    if (r === 'END:VEVENT') { if (ev && ev.inizio) grezzi.push(ev); ev = null; return; }
    if (!ev) return;
    const i = r.indexOf(':');
    if (i < 0) return;
    const chiave = r.slice(0, i), val = r.slice(i + 1), nomeK = chiave.split(';')[0].toUpperCase();
    if (nomeK === 'SUMMARY') ev.titolo = sfuggi(val);
    else if (nomeK === 'LOCATION') ev.luogo = sfuggi(val);
    else if (nomeK === 'UID') ev.uid = val.trim();
    else if (nomeK === 'DTSTART') { ev.inizio = giorno(val); ev.tutto = /VALUE=DATE(?!-)/i.test(chiave) || /^\d{8}$/.test(val); }
    else if (nomeK === 'DTEND') ev.fine = giorno(val);
    else if (nomeK === 'STATUS') ev.stato = val.trim().toUpperCase();
    else if (nomeK === 'CLASS') ev.privato = /PRIVATE|CONFIDENTIAL/i.test(val);
    else if (nomeK === 'RRULE') ev.rrule = val;
    else if (nomeK === 'EXDATE') val.split(',').forEach(function (x) { const g = giorno(x); if (g) ev.exdate.push(g); });
    else if (nomeK === 'RECURRENCE-ID') ev.ricId = giorno(val);
  });
  // Le occorrenze modificate o annullate una per una (RECURRENCE-ID) prendono il posto di quella della serie.
  const sostituite = {};
  grezzi.forEach(function (e) { if (e.ricId && e.uid) (sostituite[e.uid] = sostituite[e.uid] || new Set()).add(e.ricId); });
  const out = [];
  grezzi.forEach(function (e) {
    if (!e.titolo || e.stato === 'CANCELLED' || e.privato) return;
    let fine = e.fine || e.inizio;
    if (e.tutto && e.fine && e.fine > e.inizio) fine = meno1(e.fine); // DTEND di un giorno intero è esclusivo
    if (fine < e.inizio) fine = e.inizio;
    const base = { titolo: e.titolo.slice(0, 160), luogo: (e.luogo || '').slice(0, 120), tutto_il_giorno: !!e.tutto, calendario: nome, ricorrente: !!(e.rrule || e.ricId) };
    const date = (e.rrule && !e.ricId && da && a) ? espandi({ inizio: e.inizio, fine: fine, rrule: e.rrule }, da, a, new Set(e.exdate.concat(Array.from(sostituite[e.uid] || [])))) : [e.inizio];
    const durata = giorni(e.inizio, fine);
    date.forEach(function (g) { out.push({ titolo: base.titolo, inizio: g, fine: sposta(g, 'DAILY', durata), luogo: base.luogo, tutto_il_giorno: base.tutto_il_giorno, calendario: nome, ricorrente: base.ricorrente }); });
  });
  return out;
}

export async function sincronizzaCalendari(env) {
  const r0 = await env.DB.prepare('SELECT valore FROM config WHERE chiave = ?').bind('calendari').first();
  const cal = r0 ? JSON.parse(r0.valore) : [];
  const oggi = new Date().toISOString().slice(0, 10), limite = new Date(Date.now() + 400 * 864e5).toISOString().slice(0, 10);
  const eventi = [], esiti = [];
  for (const c of (cal || [])) {
    try {
      const r = await fetch(c.url, { headers: { accept: 'text/calendar' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      if (t.indexOf('BEGIN:VCALENDAR') === -1) throw new Error('non è un calendario .ics');
      const ev = leggiIcs(t, c.nome, oggi, limite).filter(function (e) { return e.fine >= oggi && e.inizio <= limite; });
      ev.forEach(function (e) { eventi.push(e); });
      esiti.push({ nome: c.nome, ok: true, eventi: ev.length });
    } catch (e) { esiti.push({ nome: c.nome, ok: false, errore: String(e && e.message || e).slice(0, 120) }); }
  }
  eventi.sort(function (a, b) { return a.inizio.localeCompare(b.inizio); });
  await env.DB.prepare('INSERT INTO config (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore')
    .bind('calendari_eventi', JSON.stringify({ letto: new Date().toISOString(), esiti: esiti, eventi: eventi.slice(0, 300) })).run();
  return { calendari: esiti.length, eventi: eventi.length, esiti: esiti };
}
