// Test delle funzioni di tempo (node --test, nessuna dipendenza).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const O = createRequire(import.meta.url)('../public/js/oggi.js');

test('data di Positano, non UTC: dopo mezzanotte italiana è già domani', () => {
  assert.equal(O.isoRome(new Date('2026-10-08T22:30:00Z')), '2026-10-09');
  assert.equal(O.isoRome(new Date('2026-01-15T22:30:00Z')), '2026-01-15');
});

test('alba e tramonto plausibili (errore di pochi minuti)', () => {
  const s = O.sunTimes('2026-10-08');
  assert.equal(O.formatTime(s.alba, 'it'), '07:05');
  assert.equal(O.formatTime(s.tramonto, 'it'), '18:33');
  const g = O.sunTimes('2026-06-21');
  assert.match(O.formatTime(g.tramonto, 'it'), /^20:3\d$/);
});

test('giorno della settimana e somme di giorni', () => {
  assert.equal(O.weekday('2026-10-08'), 4);
  assert.equal(O.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(O.daysBetween('2026-10-08', '2026-10-10'), 2);
});

test('ricorrenze annuali: se la data è passata vale l\'anno dopo, marcata come stimata', () => {
  const e = { data: '2026-08-14', fine: '2026-08-15', ricorrente: 'annuale' };
  assert.deepEqual(O.nextOccurrence(e, '2026-08-15'), { data: '2026-08-14', fine: '2026-08-15' });
  assert.deepEqual(O.nextOccurrence(e, '2026-10-08'), { data: '2027-08-14', fine: '2027-08-15', stimata: true });
  assert.equal(O.nextOccurrence({ data: '2026-10-01' }, '2026-10-08'), null);
});

test('periodi stagionali anche a cavallo d\'anno', () => {
  assert.ok(O.inPeriod({ dal: '11-01', al: '03-31' }, '2027-01-10'));
  assert.ok(!O.inPeriod({ dal: '11-01', al: '03-31' }, '2026-10-08'));
  assert.ok(O.inPeriod({ dal: '2026-10-01', al: '2026-10-15' }, '2026-10-15'));
  assert.ok(!O.inPeriod({ dal: '2026-10-01', al: '2026-10-15' }, '2026-10-16'));
});
