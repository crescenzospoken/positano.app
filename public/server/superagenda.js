/* Positano.app · dati pubblici da Super Agenda (Albo, Consiglio comunale, feste, post del Comune).
   La fonte è la funzione `export-pubblico` di Super Agenda, che espone solo campi già pubblici (whitelist).
   Il Worker la legge ogni 2 ore (cron) e ne tiene una copia in D1: se Super Agenda è giù, l'app mostra l'ultima copia. */
import { spiegaAtto } from './ai.js';

export const URL_EXPORT = 'https://jkkvdwrhrtafugewdshc.supabase.co/functions/v1/export-pubblico';

export async function leggiExport() {
  const r = await fetch(URL_EXPORT, { headers: { accept: 'application/json' }, cf: { cacheTtl: 120 } });
  if (!r.ok) throw new Error('Super Agenda ' + r.status);
  const d = await r.json();
  if (!d || !Array.isArray(d.albo)) throw new Error('Super Agenda: risposta non valida');
  return d;
}

/* Data e ora di una convocazione dal testo dell'oggetto («… IL GIORNO 10/08/2026 ALLE ORE 17.30»). */
export function dataSeduta(oggetto) {
  const m = String(oggetto).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const o = String(oggetto).match(/ORE\s+(\d{1,2})[.:](\d{2})/i);
  return { data: m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'), ora: o ? o[1].padStart(2, '0') + ':' + o[2] : '' };
}

/* «Delibera: Consiglio Comunale N.35 DEL 29/09/2026: OGGETTO» → { numero, data, oggetto } */
export function delibera(oggetto) {
  const m = String(oggetto).match(/N\.?\s*(\d+)\s+DEL\s+(\d{2})\/(\d{2})\/(\d{4})\s*:\s*([\s\S]*)$/i);
  if (!m) return { numero: null, data: null, oggetto: String(oggetto).replace(/^Delibera:\s*/i, '') };
  return { numero: Number(m[1]), data: m[4] + '-' + m[3] + '-' + m[2], oggetto: m[5].trim() };
}

export async function sincronizza(env, opzioni) {
  const d = await leggiExport();
  const copia = { generato: d.generato, letto: new Date().toISOString(), albo: d.albo, consiglio: d.consiglio, feste: d.feste };
  await env.DB.prepare('INSERT INTO config (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore')
    .bind('superagenda', JSON.stringify(copia)).run();
  // Spiegazioni brevi per gli atti nuovi: poche per giro, per restare nei limiti gratuiti.
  const max = (opzioni && opzioni.maxSpiegazioni) || 6;
  const fatti = new Set((await env.DB.prepare('SELECT registro FROM albo_breve').all()).results.map(function (r) { return r.registro; }));
  let n = 0;
  for (const a of d.albo) {
    if (n >= max) break;
    if (!a.registro || fatti.has(a.registro)) continue;
    const s = await spiegaAtto(env, a.oggetto, a.categoria);
    n++;
    if (s && s.it) {
      await env.DB.prepare('INSERT OR REPLACE INTO albo_breve (registro, oggetto, it, en, creato) VALUES (?,?,?,?,?)')
        .bind(a.registro, a.oggetto, String(s.it).slice(0, 260), String(s.en || '').slice(0, 260), new Date().toISOString()).run();
    }
  }
  return { albo: d.albo.length, feste: d.feste.length, spiegati: n };
}
