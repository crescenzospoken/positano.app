/* Positano.app · osservatore dell'Albo pretorio del Comune di Positano (portale HyperSIC).
   Ogni 2 ore legge la pagina pubblica di consultazione e conserva in D1 i dati essenziali di ogni atto
   (numero di registro, oggetto, categoria, date di pubblicazione): un archivio aperto e verificabile,
   senza passare da altri sistemi. Non scarica allegati e non conserva le categorie con nomi di privati
   (pubblicazioni di matrimonio, depositi alla casa comunale, elenchi delle opere abusive, determinazioni).
   Nell'app gli atti compaiono finché sono in pubblicazione; delibere e convocazioni del Consiglio restano
   consultabili (sono atti degli organi di indirizzo politico, pubblici per legge: d.lgs. 33/2013, art. 23). */
import { spiegaAtto } from './ai.js';

export const ALBO_URL = 'https://servizionline.hspromilaprod.hypersicapp.net/cmspositano/portale/albopretorio/albopretorioconsultazione.aspx?P=400';
export const CATEGORIE_OK = /^(delibere di giunta|delibere di consiglio|ordinanz|ordinanza|ordinanza sindacale|avvisi|avviso|bandi|bando|decreti|avvisi elettorali|convocazione consiglio)/i;
export const CATEGORIE_NO = /matrimonio|deposito atto|opere abusive|determinazion/i;

const ENT = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù', Agrave: 'À', Egrave: 'È', deg: '°', nbsp: ' ' };
function decode(s) { return String(s || '').replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); }).replace(/&([a-zA-Z]+);/g, function (m, n) { return ENT[n] || m; }); }
function testo(s) { return decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function dataIt(s) { const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(String(s || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; }

/* Righe della tabella: [vuota, id, data atto, numero atto, registro, oggetto, categoria, ente, pubblicato dal, al] */
export function righeAlbo(html) {
  const out = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let tm;
  while ((tm = trRe.exec(html))) {
    const c = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cm;
    while ((cm = tdRe.exec(tm[1]))) c.push(testo(cm[1]));
    if (c.length >= 10 && /^\d{4,}$/.test(c[1])) {
      out.push({ albo_id: parseInt(c[1], 10), data_atto: dataIt(c[2]), num_atto: c[3] || null, registro: parseInt(c[4], 10) || null,
        oggetto: c[5] || '', categoria: c[6] || '', ente: c[7] || '', pub_da: dataIt(c[8]), pub_a: dataIt(c[9]) });
    }
  }
  return out;
}
export function daConservare(a) { return a.oggetto && CATEGORIE_OK.test(a.categoria.trim()) && !CATEGORIE_NO.test(a.categoria); }

export async function sincronizzaAlbo(env, opzioni) {
  const r = await fetch(ALBO_URL, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; positano.app albo; +https://github.com/crescenzospoken/positano.app)' } });
  if (!r.ok) throw new Error('Albo ' + r.status);
  const tutte = righeAlbo(await r.text());
  if (!tutte.length) throw new Error('Albo: nessuna riga letta (pagina cambiata?)');
  const atti = tutte.filter(daConservare);
  const adesso = new Date().toISOString();
  const stmt = env.DB.prepare('INSERT INTO albo (albo_id, registro, num_atto, data_atto, oggetto, categoria, ente, pub_da, pub_a, primo_visto, ultimo_visto) VALUES (?,?,?,?,?,?,?,?,?,?,?) ' +
    'ON CONFLICT(albo_id) DO UPDATE SET registro=excluded.registro, oggetto=excluded.oggetto, categoria=excluded.categoria, pub_da=excluded.pub_da, pub_a=excluded.pub_a, ultimo_visto=excluded.ultimo_visto');
  if (atti.length) await env.DB.batch(atti.map(function (a) { return stmt.bind(a.albo_id, a.registro, a.num_atto, a.data_atto, a.oggetto, a.categoria, a.ente, a.pub_da, a.pub_a, adesso, adesso); }));
  await env.DB.prepare('INSERT INTO config (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore')
    .bind('albo_stato', JSON.stringify({ letto: adesso, righe: tutte.length, conservati: atti.length })).run();
  // Spiegazioni brevi per gli atti nuovi in pubblicazione: poche per giro, per restare nei limiti gratuiti.
  const max = (opzioni && opzioni.maxSpiegazioni) || 6;
  const senza = (await env.DB.prepare("SELECT a.registro, a.oggetto, a.categoria FROM albo a LEFT JOIN albo_breve b ON b.registro = a.registro WHERE b.registro IS NULL AND a.registro IS NOT NULL AND a.pub_a >= date('now') ORDER BY a.pub_da DESC LIMIT ?").bind(max).all()).results;
  let n = 0;
  for (const a of senza) {
    const s = await spiegaAtto(env, a.oggetto, a.categoria);
    if (!s || !s.it) break; // AI non disponibile: si riprova al giro dopo
    await env.DB.prepare('INSERT OR REPLACE INTO albo_breve (registro, oggetto, it, en, creato) VALUES (?,?,?,?,?)')
      .bind(a.registro, a.oggetto, String(s.it).slice(0, 260), String(s.en || '').slice(0, 260), adesso).run();
    n++;
  }
  return { righe: tutte.length, conservati: atti.length, spiegati: n };
}
