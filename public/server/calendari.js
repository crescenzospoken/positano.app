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

export function leggiIcs(testo, nome) {
  const righe = String(testo).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const out = [];
  let ev = null;
  righe.forEach(function (r) {
    if (r === 'BEGIN:VEVENT') { ev = {}; return; }
    if (r === 'END:VEVENT') {
      if (ev && ev.inizio && ev.titolo && ev.stato !== 'CANCELLED' && !ev.privato) {
        let fine = ev.fine || ev.inizio;
        if (ev.tutto && ev.fine && ev.fine > ev.inizio) fine = meno1(ev.fine); // DTEND di un giorno intero è esclusivo
        out.push({ titolo: ev.titolo.slice(0, 160), inizio: ev.inizio, fine: fine < ev.inizio ? ev.inizio : fine, luogo: (ev.luogo || '').slice(0, 120), tutto_il_giorno: !!ev.tutto, calendario: nome, ricorrente: !!ev.rrule });
      }
      ev = null; return;
    }
    if (!ev) return;
    const i = r.indexOf(':');
    if (i < 0) return;
    const chiave = r.slice(0, i), val = r.slice(i + 1), nomeK = chiave.split(';')[0].toUpperCase();
    if (nomeK === 'SUMMARY') ev.titolo = sfuggi(val);
    else if (nomeK === 'LOCATION') ev.luogo = sfuggi(val);
    else if (nomeK === 'DTSTART') { ev.inizio = giorno(val); ev.tutto = /VALUE=DATE(?!-)/i.test(chiave) || /^\d{8}$/.test(val); }
    else if (nomeK === 'DTEND') ev.fine = giorno(val);
    else if (nomeK === 'STATUS') ev.stato = val.trim().toUpperCase();
    else if (nomeK === 'CLASS') ev.privato = /PRIVATE|CONFIDENTIAL/i.test(val);
    else if (nomeK === 'RRULE') ev.rrule = val;
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
      const ev = leggiIcs(t, c.nome).filter(function (e) { return e.fine >= oggi && e.inizio <= limite; });
      ev.forEach(function (e) { eventi.push(e); });
      esiti.push({ nome: c.nome, ok: true, eventi: ev.length });
    } catch (e) { esiti.push({ nome: c.nome, ok: false, errore: String(e && e.message || e).slice(0, 120) }); }
  }
  eventi.sort(function (a, b) { return a.inizio.localeCompare(b.inizio); });
  await env.DB.prepare('INSERT INTO config (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore')
    .bind('calendari_eventi', JSON.stringify({ letto: new Date().toISOString(), esiti: esiti, eventi: eventi.slice(0, 300) })).run();
  return { calendari: esiti.length, eventi: eventi.length, esiti: esiti };
}
