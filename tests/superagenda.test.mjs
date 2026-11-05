// Parser dei testi dell'Albo che arrivano da Super Agenda.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dataSeduta, delibera } from '../public/server/superagenda.js';

test('data e ora della seduta dalla convocazione', () => {
  assert.deepEqual(dataSeduta('CONVOCAZIONE CONSIGLIO COMUNALE IL GIORNO 10/08/2026 ALLE ORE 17.30'), { data: '2026-08-10', ora: '17:30' });
  assert.deepEqual(dataSeduta('CONVOCAZIONE CONSIGLIO COMUNALE GIORNO 30/07/2026'), { data: '2026-07-30', ora: '' });
  assert.equal(dataSeduta('Convocazione senza data'), null);
});

test('numero, data e oggetto della delibera', () => {
  assert.deepEqual(delibera('Delibera: Consiglio Comunale N.35 DEL 29/09/2026: MODIFICHE ALLO STATUTO COMUNALE'), { numero: 35, data: '2026-09-29', oggetto: 'MODIFICHE ALLO STATUTO COMUNALE' });
  assert.equal(delibera('Testo libero').numero, null);
});
