// Meteo e mare per Positano da Open-Meteo (dati CC BY 4.0, uso non commerciale).
// La chiamata la fa GitHub, non il telefono di chi usa l'app: nessun indirizzo IP dei visitatori va a terzi.
import { writeFileSync } from 'node:fs';
const LAT = 40.6286, LON = 14.4849;
const UA = { 'User-Agent': 'positano-app/0.3 (+https://github.com/crescenzospoken/positano.app)' };
const q = (u) => fetch(u, { headers: UA }).then(r => { if (!r.ok) throw new Error(u + ' HTTP ' + r.status); return r.json(); });
const m = await q(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Europe%2FRome&forecast_days=3`);
let mare = null;
try {
  const s = await q(`https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height,sea_surface_temperature&daily=wave_height_max&timezone=Europe%2FRome&forecast_days=3`);
  mare = { onde: s.current.wave_height, acqua: s.current.sea_surface_temperature, onde_max: s.daily.wave_height_max };
} catch (e) { console.error('mare non disponibile:', e.message); }
const out = {
  aggiornato: new Date().toISOString(),
  fonte: { nome: 'Open-Meteo (CC BY 4.0)', url: 'https://open-meteo.com/' },
  ora: { temperatura: m.current.temperature_2m, percepita: m.current.apparent_temperature, pioggia: m.current.precipitation, codice: m.current.weather_code, vento: m.current.wind_speed_10m, raffiche: m.current.wind_gusts_10m },
  giorni: m.daily.time.map((d, i) => ({ data: d, codice: m.daily.weather_code[i], max: m.daily.temperature_2m_max[i], min: m.daily.temperature_2m_min[i], pioggia_prob: m.daily.precipitation_probability_max[i], vento_max: m.daily.wind_speed_10m_max[i], onde_max: mare ? mare.onde_max[i] : null })),
  mare: mare ? { onde: mare.onde, acqua: mare.acqua } : null
};
writeFileSync(new URL('../public/data/meteo.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log('meteo', out.ora.temperatura, out.mare);
