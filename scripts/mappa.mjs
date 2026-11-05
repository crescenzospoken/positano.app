// Genera public/data/mappa.json da OpenStreetMap (© contributori OpenStreetMap, licenza ODbL):
// costa e strade principali per disegnare la mappa offline, più fermate, defibrillatori, farmacie, servizi.
// Gira su GitHub Actions (settimanale o a mano). Nessuna chiamata a terzi dal telefono di chi usa l'app.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const BBOX = [40.6155, 14.4700, 40.6420, 14.5420]; // sud, ovest, nord, est: Positano con Montepertuso e Nocelle
const SERVER = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const b = BBOX.join(',');
const Q = `[out:json][timeout:90];
(
  way(${b})["natural"="coastline"];
  way(${b})["highway"~"^(primary|secondary|tertiary|unclassified|residential|living_street|pedestrian)$"];
)->.linee;
.linee out geom;
(
  node(${b})["highway"="bus_stop"];
  node(${b})["emergency"="defibrillator"];
  nwr(${b})["amenity"~"^(pharmacy|police|hospital|clinic|doctors|toilets|townhall|post_office|ferry_terminal|place_of_worship)$"];
  nwr(${b})["natural"="beach"]["name"];
);
out center tags;`;

const TIPI = [
  ['defibrillatore', (t) => t.emergency === 'defibrillator'],
  ['fermata', (t) => t.highway === 'bus_stop'],
  ['farmacia', (t) => t.amenity === 'pharmacy'],
  ['sanita', (t) => ['hospital', 'clinic', 'doctors'].includes(t.amenity)],
  ['sicurezza', (t) => t.amenity === 'police'],
  ['comune', (t) => ['townhall', 'post_office'].includes(t.amenity)],
  ['porto', (t) => t.amenity === 'ferry_terminal'],
  ['bagni', (t) => t.amenity === 'toilets'],
  ['spiaggia', (t) => t.natural === 'beach'],
  ['chiesa', (t) => t.amenity === 'place_of_worship']
];

async function scarica() {
  for (const s of SERVER) {
    try {
      const r = await fetch(s, { method: 'POST', body: new URLSearchParams({ data: Q }), headers: { 'user-agent': 'positano.app (mappa offline, open source)' } });
      if (r.ok) return await r.json();
      console.error(s, r.status);
    } catch (e) { console.error(s, e.message); }
  }
  throw new Error('Nessun server Overpass disponibile');
}

const r5 = (n) => Math.round(n * 1e5) / 1e5;
// Douglas-Peucker per alleggerire le linee (tolleranza ~4 m)
function semplifica(pt, tol) {
  if (pt.length < 3) return pt;
  const [a, z] = [pt[0], pt[pt.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pt.length - 1; i++) {
    const [x, y] = pt[i], [x1, y1] = a, [x2, y2] = z;
    const d = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / (Math.hypot(y2 - y1, x2 - x1) || 1e-12);
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [a, z];
  return semplifica(pt.slice(0, idx + 1), tol).slice(0, -1).concat(semplifica(pt.slice(idx), tol));
}

const d = await scarica();
const costa = [], strade = [], punti = [];
for (const e of d.elements) {
  const t = e.tags || {};
  if (e.type === 'way' && e.geometry) {
    const linea = semplifica(e.geometry.map((g) => [r5(g.lon), r5(g.lat)]), 0.00004);
    if (t.natural === 'coastline') costa.push(linea);
    else strade.push({ l: linea, k: /primary|secondary/.test(t.highway) ? 1 : 0, n: t.name || '' });
    continue;
  }
  const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
  if (lat == null) continue;
  const tipo = TIPI.find(([, f]) => f(t));
  if (!tipo) continue;
  if (tipo[0] === 'chiesa' && !t.name) continue;
  punti.push({ id: e.type[0] + e.id, tipo: tipo[0], nome: t.name || '', lat: r5(lat), lon: r5(lon), nota: t['defibrillator:location'] || t.opening_hours || '' });
}
if (!costa.length || !punti.length) throw new Error('Dati OSM incompleti: non sovrascrivo la mappa');
const out = { aggiornato: new Date().toISOString().slice(0, 10), bbox: BBOX, fonte: { nome: '© contributori OpenStreetMap (ODbL)', url: 'https://www.openstreetmap.org/copyright' }, costa, strade, punti };
const file = 'public/data/mappa.json';
const prima = existsSync(file) ? readFileSync(file, 'utf8') : '';
const json = JSON.stringify(out);
if (prima && JSON.stringify(Object.assign(JSON.parse(prima), { aggiornato: out.aggiornato })) === json) console.log('mappa invariata');
else { writeFileSync(file, json + '\n'); console.log('mappa aggiornata:', costa.length, 'tratti di costa,', strade.length, 'strade,', punti.length, 'punti'); }
