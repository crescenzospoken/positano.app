// Allerta meteo per Positano dai bollettini ufficiali del Dipartimento della Protezione Civile (CC BY 4.0).
// Scrive public/data/allerta.json. Lanciato da .github/workflows/aggiorna-dati.yml.
import { execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = 'https://github.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica';
const RAW = 'https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/master/files/';
const UA = { 'User-Agent': 'positano-app/0.3 (+https://github.com/crescenzospoken/positano.app)' };
const dir = mkdtempSync(join(tmpdir(), 'dpc-'));
execSync(`git clone -q --depth 1 --filter=blob:none --no-checkout ${REPO} ${dir}`);
const id = execSync(`git -C ${dir} ls-tree --name-only HEAD files/`).toString()
  .split('\n').filter(f => /^files\/\d{8}_\d{4}\.json$/.test(f)).sort().pop().slice(6, 19);
const livello = s => /ROSSA/.test(s || '') ? 'rosso' : /ARANCIONE/.test(s || '') ? 'arancione' : /GIALLA/.test(s || '') ? 'giallo' : 'verde';
const out = {
  aggiornato: new Date().toISOString(),
  bollettino: id,
  fonte: { nome: 'Dipartimento della Protezione Civile, bollettino di criticità (CC BY 4.0)', url: 'https://mappe.protezionecivile.gov.it/it/mappe-rischi/bollettino-di-criticita' },
  giorni: {}
};
for (const g of ['today', 'tomorrow']) {
  const r = await fetch(`${RAW}geojson/${id}_${g}.json`, { headers: UA });
  if (!r.ok) throw new Error('Bollettino ' + g + ': HTTP ' + r.status);
  const fc = await r.json();
  const f = fc.features.find(x => (x.properties.Comuni || []).includes('Positano'));
  if (!f) throw new Error('Positano non trovato nel bollettino');
  const p = f.properties;
  const d = new Date(Date.UTC(+id.slice(0, 4), +id.slice(4, 6) - 1, +id.slice(6, 8) + (g === 'tomorrow' ? 1 : 0)));
  out.giorni[d.toISOString().slice(0, 10)] = {
    zona: p['Nome zona'],
    complessivo: livello(p['Rappresentata nella mappa']),
    idrogeologico: livello(p['Per rischio idrogeologico']),
    idraulico: livello(p['Per rischio idraulico']),
    temporali: livello(p['Per rischio temporali'])
  };
}
writeFileSync(new URL('../public/data/allerta.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('allerta', id, JSON.stringify(out.giorni));
