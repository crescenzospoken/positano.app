// Avvisi dal sito del Comune (feed RSS pubblici): avvisi, trasporto pubblico, ZTL.
// Scrive public/data/avvisi-comune.json con gli ultimi avvisi (massimo 45 giorni), testo ripulito e link all'originale.
import { writeFileSync } from 'node:fs';
const BASE = 'https://comune.positano.sa.it';
const FEED = [
  { url: BASE + '/taxonomy/term/9/feed', categoria: 'istituzionale' },
  { url: BASE + '/taxonomy/term/246/feed', categoria: 'viabilita' },
  { url: BASE + '/taxonomy/term/254/feed', categoria: 'viabilita' }
];
const UA = { 'User-Agent': 'positano-app/0.3 (+https://github.com/crescenzospoken/positano.app)' };
const ent = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', egrave: 'è', eacute: 'é', agrave: 'à', ograve: 'ò', ugrave: 'ù', igrave: 'ì', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ndash: '–', mdash: '—', laquo: '«', raquo: '»' };
const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, c) => c[0] === '#' ? String.fromCodePoint(c[1] === 'x' ? parseInt(c.slice(2), 16) : +c.slice(1)) : (ent[c] ?? m));
const tag = (x, t) => { const m = x.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>')); return m ? decode(m[1]).trim() : ''; };
const pulisci = h => decode(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const limite = Date.now() - 45 * 86400000;
const visti = new Map();
for (const f of FEED) {
  let xml;
  try { const r = await fetch(f.url, { headers: UA }); if (!r.ok) throw new Error('HTTP ' + r.status); xml = await r.text(); }
  catch (e) { console.error('feed', f.url, e.message); continue; }
  for (const it of xml.split('<item>').slice(1)) {
    const link = tag(it, 'link'), titolo = pulisci(tag(it, 'title')), quando = Date.parse(tag(it, 'pubDate'));
    if (!link || !titolo || !quando || quando < limite) continue;
    if (!/\/novita\//.test(link)) continue; // solo avvisi e notizie, non gli atti dell'albo
    // La descrizione del feed contiene l'intera pagina (menu, ufficio, data): teniamo titolo, data e link all'originale.
    if (!visti.has(link)) visti.set(link, { id: 'c' + link.split('/').pop().slice(0, 60), titolo: { it: titolo }, categoria: f.categoria, data: new Date(quando).toISOString().slice(0, 10), link, fonte: { nome: 'Sito del Comune di Positano', url: link } });
  }
}
const avvisi = [...visti.values()].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 20);
writeFileSync(new URL('../public/data/avvisi-comune.json', import.meta.url), JSON.stringify({ aggiornato: new Date().toISOString(), avvisi }, null, 1) + '\n');
console.log('avvisi dal Comune:', avvisi.length);
