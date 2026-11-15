// Osservatore dell'Albo e calendari .ics: parser provati su testi realistici.
import test from 'node:test';
import assert from 'node:assert/strict';
import { righeAlbo, daConservare } from '../public/server/albo.js';
import { leggiIcs } from '../public/server/calendari.js';

const riga = (id, reg, ogg, cat, da, a) => `<tr class="r"><td><input type="hidden"></td><td>${id}</td><td></td><td></td><td>${reg}</td><td><span>${ogg}</span></td><td>${cat}</td><td>AREA</td><td>${da}</td><td>${a}</td></tr>`;

test('righe della tabella dell\'Albo', () => {
  const html = '<table><tr><th>Intestazione</th></tr>' + riga(48854, 2050, 'AVVISO PUBBLICO GITA SOCIALE &amp; ANZIANI', 'Avvisi', '03/11/2026', '06/11/2026') +
    riga(48853, 2049, 'AVVISO DEPOSITO ATTI - ROSSI MARIO', 'DEPOSITO ATTO CASA COMUNALE-', '03/11/2026', '11/11/2026') + '</table>';
  const r = righeAlbo(html);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { albo_id: 48854, data_atto: null, num_atto: null, registro: 2050, oggetto: 'AVVISO PUBBLICO GITA SOCIALE & ANZIANI', categoria: 'Avvisi', ente: 'AREA', pub_da: '2026-11-03', pub_a: '2026-11-06' });
  assert.ok(daConservare(r[0]));
  assert.ok(!daConservare(r[1]), 'i depositi con nomi di privati non si conservano');
});

test('categorie conservate e scartate', () => {
  const c = (categoria) => daConservare({ oggetto: 'x', categoria });
  ['Delibere di Giunta', 'Delibere di Consiglio', 'ORDINANZA SINDACALE', 'Ordinanze', 'AVVISO PUBBLICO', 'Bandi', 'Decreti', 'CONVOCAZIONE CONSIGLIO COMUNAL', 'Avvisi Elettorali'].forEach((k) => assert.ok(c(k), k));
  ['Determinazioni', 'PUBBLICAZIONE DI MATRIMONIO', 'ELENCO MENSILE OPERE ABUSIVE', 'DEPOSITO ATTO CASA COMUNALE-'].forEach((k) => assert.ok(!c(k), k));
});

test('calendario .ics: giorno intero, ora UTC, righe spezzate, eventi privati e annullati', () => {
  const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261125', 'DTEND;VALUE=DATE:20261126', 'SUMMARY:Festa di Santa Caterina d’Alessandria (Chiesa ', ' Nuova)', 'LOCATION:Chiesa Nuova\\, Positano', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART:20261207T230000Z', 'DTEND:20261208T010000Z', 'SUMMARY:Immacolata', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261201', 'SUMMARY:Riunione privata', 'CLASS:PRIVATE', 'END:VEVENT',
    'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:20261202', 'SUMMARY:Annullato', 'STATUS:CANCELLED', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const e = leggiIcs(ics, 'Feste');
  assert.equal(e.length, 2);
  assert.deepEqual(e[0], { titolo: 'Festa di Santa Caterina d’Alessandria (Chiesa Nuova)', inizio: '2026-11-25', fine: '2026-11-25', luogo: 'Chiesa Nuova, Positano', tutto_il_giorno: true, calendario: 'Feste', ricorrente: false });
  assert.equal(e[1].inizio, '2026-12-08', 'mezzanotte e un\'ora a Roma');
});

test('calendario .ics: ricorrenze annuali, eccezioni e occorrenze spostate', () => {
  const ics = ['BEGIN:VCALENDAR',
    'BEGIN:VEVENT', 'UID:a', 'DTSTART;VALUE=DATE:20250615', 'DTEND;VALUE=DATE:20250616', 'RRULE:FREQ=YEARLY', 'SUMMARY:San Vito', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:b', 'DTSTART;VALUE=DATE:20250815', 'DTEND;VALUE=DATE:20250817', 'RRULE:FREQ=YEARLY;COUNT=2', 'SUMMARY:Assunta', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:c', 'DTSTART;VALUE=DATE:20251124', 'RRULE:FREQ=YEARLY', 'EXDATE;VALUE=DATE:20261124', 'SUMMARY:Santa Caterina', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:d', 'DTSTART;VALUE=DATE:20250714', 'RRULE:FREQ=YEARLY', 'SUMMARY:Carmelo', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:d', 'RECURRENCE-ID;VALUE=DATE:20260714', 'DTSTART;VALUE=DATE:20260716', 'SUMMARY:Carmelo (spostata)', 'END:VEVENT',
    'BEGIN:VEVENT', 'UID:e', 'DTSTART;VALUE=DATE:20250101', 'RRULE:FREQ=MONTHLY;BYDAY=1MO', 'SUMMARY:Regola complessa', 'END:VEVENT',
    'END:VCALENDAR'].join('\r\n');
  const e = leggiIcs(ics, 'Feste', '2026-01-01', '2027-12-31');
  const t = (x) => e.filter((v) => v.titolo === x).map((v) => v.inizio + '/' + v.fine);
  assert.deepEqual(t('San Vito'), ['2026-06-15/2026-06-15', '2027-06-15/2027-06-15']);
  assert.deepEqual(t('Assunta'), ['2026-08-15/2026-08-16'], 'COUNT=2 si ferma al 2026, durata di due giorni');
  assert.deepEqual(t('Santa Caterina'), ['2027-11-24/2027-11-24'], 'EXDATE salta il 2026');
  assert.deepEqual(t('Carmelo'), ['2027-07-14/2027-07-14']);
  assert.deepEqual(t('Carmelo (spostata)'), ['2026-07-16/2026-07-16']);
  assert.deepEqual(t('Regola complessa'), ['2025-01-01/2025-01-01'], 'regole con BYDAY: solo la prima data');
  assert.ok(e.every((v) => v.ricorrente));
});
