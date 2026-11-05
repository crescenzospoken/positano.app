/* Positano.app · intelligenza artificiale con Workers AI di Cloudflare (nessuna chiave esterna, nessun dato personale).
   Usata solo per: bozza di avviso da un post del Comune (la redazione approva sempre), traduzione in inglese,
   spiegazione breve degli atti dell'Albo. Ogni testo generato è segnalato come automatico (AI Act, art. 50).
   Se il servizio non risponde, le funzioni restituiscono null e l'app continua senza. */

const MODELLO = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export function disponibile(env) { return !!(env && env.AI && typeof env.AI.run === 'function'); }

async function chiedi(env, sistema, utente, schema, maxTok) {
  if (!disponibile(env)) return null;
  try {
    const r = await env.AI.run(MODELLO, {
      messages: [{ role: 'system', content: sistema }, { role: 'user', content: utente }],
      response_format: { type: 'json_schema', json_schema: schema },
      max_tokens: maxTok || 700, temperature: 0.2
    });
    let v = r && r.response;
    if (typeof v === 'string') { const m = v.match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : null; }
    return v && typeof v === 'object' ? v : null;
  } catch (e) {
    console.error('AI', e && e.message);
    return null;
  }
}

const S = function (props) { return { type: 'object', properties: props, required: Object.keys(props) }; };
const STR = { type: 'string' };

export async function traduci(env, campi) {
  const chiavi = Object.keys(campi).filter(function (k) { return campi[k]; });
  if (!chiavi.length) return {};
  const props = {};
  chiavi.forEach(function (k) { props[k] = STR; });
  return chiedi(env,
    'Traduci dall\'italiano all\'inglese testi di servizio di un Comune, per residenti e visitatori. Inglese semplice e cortese, nessuna aggiunta, ' +
    'mantieni nomi di luoghi, numeri, orari e date. Rispondi solo con il JSON richiesto.',
    JSON.stringify(Object.fromEntries(chiavi.map(function (k) { return [k, campi[k]]; }))), S(props));
}

export async function spiegaAtto(env, oggetto, categoria) {
  return chiedi(env,
    'Riscrivi in linguaggio semplice l\'oggetto di un atto dell\'Albo pretorio del Comune di Positano. Massimo 200 caratteri per lingua. ' +
    'Di\' cosa decide o comunica, senza inventare nulla che non sia nell\'oggetto; niente nomi di persone. «it» in italiano, «en» in inglese.',
    'Categoria: ' + categoria + '\nOggetto: ' + oggetto, S({ it: STR, en: STR }), 300);
}

export const CATEGORIE = ['emergenze', 'viabilita', 'cultura', 'sanita', 'sport', 'ambiente', 'turismo', 'scuole', 'lavori', 'sociale', 'oggi', 'comunicati', 'istituzionale', 'protezione-civile'];

export async function bozzaAvviso(env, post, oggiIso, zone) {
  return chiedi(env,
    'Sei la redazione dell\'app civica di Positano. Da un post Instagram del Comune prepara la BOZZA di un avviso breve e chiaro. ' +
    'Usa solo informazioni presenti nel post; se una data non c\'è usa per «dal» la data del post e per «al» la stessa data o pochi giorni dopo. ' +
    'Date in formato AAAA-MM-GG. Titolo massimo 90 caratteri, testo massimo 400. «servizio»: acqua, luce, gas, strade oppure stringa vuota. ' +
    '«zone»: solo nomi presi da questo elenco se il post li cita, altrimenti elenco vuoto: ' + zone.join(', ') + '. ' +
    '«categoria» una di: ' + CATEGORIE.join(', ') + '. Rispondi solo con il JSON.',
    'Oggi: ' + oggiIso + '\nData del post: ' + String(post.quando || '').slice(0, 10) + '\nTitolo: ' + (post.titolo || '') +
    '\nDidascalia: ' + String(post.testo || '').slice(0, 2500) + '\nTesto nell\'immagine: ' + String(post.testo_immagine || '').slice(0, 1200),
    S({ titolo_it: STR, testo_it: STR, titolo_en: STR, testo_en: STR, categoria: STR, dal: STR, al: STR, servizio: STR, zone: { type: 'array', items: STR } }), 900);
}
