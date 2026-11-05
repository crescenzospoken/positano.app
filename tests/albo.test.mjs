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
