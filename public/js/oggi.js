/* Positano.app · "la app sa che ore sono": data italiana, alba e tramonto, ricorrenze.
   Funzioni pure, senza rete: tutto si calcola sul telefono. Usabili anche da Node (test). */
(function (root) {
  'use strict';

  const TZ = 'Europe/Rome';
  // Piazza dei Mulini, Positano
  const LAT = 40.6286, LON = 14.4849;

  /* Data di oggi a Positano, come 'AAAA-MM-GG' (non UTC: dopo mezzanotte conta l'ora italiana). */
  function isoRome(d) {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d || new Date());
    const g = function (t) { return p.find(function (x) { return x.type === t; }).value; };
    return g('year') + '-' + g('month') + '-' + g('day');
  }

  /* Minuti dalla mezzanotte, ora di Positano. */
  function minutesRome(d) {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d || new Date());
    const g = function (t) { return Number(p.find(function (x) { return x.type === t; }).value); };
    return g('hour') * 60 + g('minute');
  }

  /* Giorno della settimana (0 = domenica) di una data ISO. */
  function weekday(iso) {
    const a = iso.split('-').map(Number);
    return new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay();
  }

  function addDays(iso, n) {
    const a = iso.split('-').map(Number);
    const d = new Date(Date.UTC(a[0], a[1] - 1, a[2] + n));
    return d.toISOString().slice(0, 10);
  }

  function daysBetween(fromIso, toIso) {
    const f = fromIso.split('-').map(Number), t = toIso.split('-').map(Number);
    return Math.round((Date.UTC(t[0], t[1] - 1, t[2]) - Date.UTC(f[0], f[1] - 1, f[2])) / 86400000);
  }

  /* Alba e tramonto (algoritmo NOAA semplificato, errore ~1 minuto). Restituisce Date UTC. */
  function sunTimes(iso, lat, lon) {
    lat = lat == null ? LAT : lat; lon = lon == null ? LON : lon;
    const a = iso.split('-').map(Number);
    const rad = Math.PI / 180;
    const dayMs = Date.UTC(a[0], a[1] - 1, a[2]);
    const n = Math.round((dayMs - Date.UTC(2000, 0, 1, 12)) / 86400000);
    const Jstar = n - lon / 360;
    const M = (357.5291 + 0.98560028 * Jstar) % 360;
    const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const Jtransit = 2451545 + Jstar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    const decl = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    if (cosH < -1 || cosH > 1) return null;
    const H = Math.acos(cosH) / rad;
    const toDate = function (J) { return new Date((J - 2440587.5) * 86400000); };
    return { alba: toDate(Jtransit - H / 360), tramonto: toDate(Jtransit + H / 360) };
  }

  function formatTime(d, lang) {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  }

  function formatDate(iso, lang, opts) {
    const a = iso.split('-').map(Number);
    const d = new Date(Date.UTC(a[0], a[1] - 1, a[2], 12));
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', Object.assign({ timeZone: TZ, day: 'numeric', month: 'long' }, opts || {})).format(d);
  }

  /* Prossima occorrenza (>= oggi) di un evento. Gestisce:
     - data singola o intervallo (data, fine)
     - ricorrente "annuale": stessa data ogni anno (se non c'è una data diversa per l'anno in corso). */
  function nextOccurrence(ev, todayIso) {
    if (!ev.data) return null;
    const fine = ev.fine || ev.data;
    if (fine >= todayIso) return { data: ev.data, fine: fine };
    if (ev.ricorrente === 'annuale' || ev.ricorrente === true) {
      const durata = daysBetween(ev.data, fine);
      let y = Number(todayIso.slice(0, 4));
      for (let i = 0; i < 2; i++, y++) {
        const start = y + ev.data.slice(4);
        const end = addDays(start, durata);
        if (end >= todayIso) return { data: start, fine: end, stimata: Number(ev.data.slice(0, 4)) !== y };
      }
    }
    return null;
  }

  /* Un periodo {dal, al} in formato 'MM-GG' (stagioni) o 'AAAA-MM-GG' contiene la data? */
  function inPeriod(period, iso) {
    if (!period) return true;
    if (period.dal && period.dal.length === 10) return iso >= period.dal && (!period.al || iso <= period.al);
    const md = iso.slice(5);
    const dal = period.dal || '01-01', al = period.al || '12-31';
    return dal <= al ? (md >= dal && md <= al) : (md >= dal || md <= al);
  }

  const api = { TZ: TZ, LAT: LAT, LON: LON, isoRome: isoRome, minutesRome: minutesRome, weekday: weekday, addDays: addDays,
    daysBetween: daysBetween, sunTimes: sunTimes, formatTime: formatTime, formatDate: formatDate,
    nextOccurrence: nextOccurrence, inPeriod: inPeriod };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PA_OGGI = api;
})(this);
