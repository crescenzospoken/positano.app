// Controlli sui dati: ogni testo in italiano e inglese, date valide, id unici, coordinate dentro la zona.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../public/data/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
const load = f => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const TESTO = ['nome', 'titolo', 'nota', 'sottotitolo', 'testo', 'intro', 'orari', 'luogo', 'voce', 'dove', 'esposizione', 'avviso', 'da'];

function walk(x, path, out) {
  if (Array.isArray(x)) x.forEach((v, i) => walk(v, path + '[' + i + ']', out));
  else if (x && typeof x === 'object') {
    if ('it' in x || 'en' in x) out.bilingue.push([path, x]);
    for (const [k, v] of Object.entries(x)) {
      if (k === 'coord') out.coord.push([path, v]);
      if (k === 'id' && typeof v === 'string') out.id.push([path, v]);
      if (['data', 'fine', 'aggiornato', 'consultata'].includes(k)) out.date.push([path + '.' + k, v]);
      if (TESTO.includes(k) && typeof v === 'string' && path.indexOf('fonte') === -1 && k !== 'da') out.monolingue.push(path + '.' + k);
      walk(v, path + '.' + k, out);
    }
  }
}

for (const f of files) {
  test(f, () => {
    const d = load(f);
    const out = { bilingue: [], coord: [], id: [], date: [], monolingue: [] };
    walk(d, f, out);
    for (const [p, v] of out.bilingue) {
      assert.ok(v.it && v.it.trim(), p + ': manca il testo italiano');
      assert.ok(v.en && v.en.trim(), p + ': manca il testo inglese');
    }
    if (f !== 'meta.json') assert.deepEqual(out.monolingue, [], 'testi senza traduzione');
    for (const [p, v] of out.date) assert.match(String(v), ISO, p + ': data non valida');
    for (const [p, c] of out.coord) {
      assert.ok(c[0] > 40.55 && c[0] < 40.70 && c[1] > 14.40 && c[1] < 14.65, p + ': coordinate fuori zona ' + c);
    }
    const ids = out.id.map(x => x[1]);
    assert.equal(new Set(ids).size, ids.length, 'id duplicati: ' + ids.filter((v, i) => ids.indexOf(v) !== i));
    if (f !== 'meta.json') assert.match(d.aggiornato || '', ISO, 'manca "aggiornato"');
  });
}

test('il service worker salva tutti i file di dati', () => {
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  for (const f of files) assert.ok(sw.includes("'data/" + f + "'"), f + ' non è nella cache offline');
});
