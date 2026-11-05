// Controllo settimanale: dati in scadenza (orari, periodi, avvisi) e link rotti.
// Scrive il resoconto in controlli.md; il workflow apre o aggiorna una issue se c'è qualcosa da fare.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const dir = new URL('../public/data/', import.meta.url);
const oggi = new Date().toISOString().slice(0, 10);
const fra = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const scadenze = [], links = new Map();
const GENERATI = ['avvisi-comune.json', 'allerta.json', 'meteo.json'];
for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  (function walk(x, path) {
    if (Array.isArray(x)) return x.forEach((v, i) => walk(v, path + '[' + i + ']'));
    if (!x || typeof x !== 'object') return;
    const nome = (x.nome && (x.nome.it || x.nome)) || (x.titolo && (x.titolo.it || x.titolo)) || x.id || path;
    const al = x.al || (x.periodo && x.periodo.al);
    if (typeof al === 'string' && al.length === 10 && al >= oggi && al <= fra(10)) scadenze.push(`- **${f}** · ${nome}: valido fino al ${al}`);
    if (Array.isArray(x.orari) && x.al && x.al < oggi) scadenze.push(`- **${f}** · ${nome}: orario scaduto il ${x.al}, non compare più in home`);
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === 'string' && /^https:\/\//.test(v) && !/instagram\.com|facebook\.com/.test(v) && !GENERATI.includes(f)) { if (!links.has(v)) links.set(v, []); links.get(v).push(`${f} · ${nome}`); }
      walk(v, path + '.' + k);
    }
  })(d, f);
}
const UA = { 'User-Agent': 'positano-app/0.3 (+https://github.com/crescenzospoken/positano.app)' };
const rotti = [];
for (const [url, dove] of links) {
  let stato = 0;
  for (const metodo of ['HEAD', 'GET']) {
    try { const r = await fetch(url, { method: metodo, headers: UA, redirect: 'follow', signal: AbortSignal.timeout(15000) }); stato = r.status; if (r.ok) break; }
    catch (e) { stato = 'errore: ' + e.message; }
  }
  if (!(stato >= 200 && stato < 400)) rotti.push(`- ${url} → ${stato} (${dove.slice(0, 3).join('; ')})`);
}
let md = '';
if (scadenze.length) md += '## Dati in scadenza nei prossimi 10 giorni\n\n' + scadenze.join('\n') + '\n\n';
if (rotti.length) md += '## Link che non rispondono\n\nAlcuni siti rifiutano i controlli automatici: va aperto a mano prima di correggere.\n\n' + rotti.join('\n') + '\n';
writeFileSync('controlli.md', md);
console.log(md || 'Tutto a posto: nessuna scadenza vicina, nessun link rotto.');
