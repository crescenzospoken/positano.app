// Super Agenda → Positano.app: il «ponte» pubblico.
// Edge function `export-pubblico` del progetto Supabase di Super Agenda (verify_jwt: false, solo GET).
// Espone in sola lettura SOLO campi già pubblici, scelti uno per uno (whitelist):
//  - Albo pretorio: atti in pubblicazione, escluse le categorie con nomi di privati
//    (matrimoni, depositi alla casa comunale, elenchi opere abusive) e le determinazioni.
//  - Consiglio comunale: ultime convocazioni e ultime delibere di Consiglio.
//  - Feste: eventi dei calendari «Feste Positanesi» ed «Eventi Pubblici» (titolo, date, luogo; niente descrizioni).
//  - Instagram del Comune: post degli ultimi 45 giorni (testo, testo letto dall'immagine, foto pubblica).
// Nessun dato di persone, nessuna nota interna, nessun allegato privato.
// Il codice sorgente vive nel repo positano.app (integrazioni/superagenda); va copiato anche nel repo di Super Agenda.

const URL_SB = Deno.env.get('SUPABASE_URL')!;
const CHIAVE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CALENDARI = ['Feste Positanesi', 'Eventi Pubblici'];
const ALBO_OK = ['Delibere di Giunta', 'Delibere di Consiglio', 'Ordinanze', 'ORDINANZA', 'ORDINANZA SINDACALE', 'Avvisi', 'AVVISO PUBBLICO',
  'AVVISO BANDO', 'Bandi', 'BANDO DI GARA', 'Decreti', 'Avvisi Elettorali', 'CONVOCAZIONE CONSIGLIO COMUNAL'];

async function rest(percorso: string) {
  const r = await fetch(URL_SB + '/rest/v1/' + percorso, { headers: { apikey: CHIAVE, authorization: 'Bearer ' + CHIAVE } });
  if (!r.ok) throw new Error(percorso.split('?')[0] + ' ' + r.status);
  return r.json();
}
const lista = (a: string[]) => '(' + a.map((s) => '"' + s.replace(/"/g, '') + '"').join(',') + ')';

Deno.serve(async (req) => {
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'GET') return new Response('Solo GET', { status: 405, headers: cors });
  try {
    const oggi = new Date().toISOString().slice(0, 10);
    const ig45 = new Date(Date.now() - 45 * 864e5).toISOString();
    const [albo, convocazioni, delibere, calendari, ig] = await Promise.all([
      rest('albo_items?select=registro,oggetto,categoria,data_atto,pub_da,pub_a&pub_a=gte.' + oggi + '&categoria=in.' + encodeURIComponent(lista(ALBO_OK)) + '&order=pub_da.desc&limit=120'),
      rest('albo_items?select=registro,oggetto,data_atto,pub_da,pub_a&categoria=eq.' + encodeURIComponent('CONVOCAZIONE CONSIGLIO COMUNAL') + '&order=pub_da.desc&limit=3'),
      rest('albo_items?select=registro,oggetto,data_atto,pub_da&categoria=eq.' + encodeURIComponent('Delibere di Consiglio') + '&order=registro.desc&limit=25'),
      rest('calendar_sources?select=id,name&name=in.' + encodeURIComponent(lista(CALENDARI))),
      rest('ig_posts?select=id,permalink,taken_at,titolo,caption,testo_immagine,img_md,alt&removed_at=is.null&taken_at=gte.' + ig45 + '&order=taken_at.desc&limit=60')
    ]);
    const nomi: Record<string, string> = {};
    for (const c of calendari) nomi[c.id] = c.name;
    const ieri = new Date(Date.now() - 864e5).toISOString();
    const eventi = calendari.length ? await rest('events?select=title,starts_at,ends_at,all_day,location,calendar_source_id&calendar_source_id=in.(' +
      calendari.map((c: { id: string }) => c.id).join(',') + ')&ends_at=gte.' + ieri + '&order=starts_at.asc&limit=80') : [];
    const corpo = {
      generato: new Date().toISOString(),
      fonte: 'Super Agenda · export-pubblico v1',
      albo, consiglio: { convocazioni, delibere },
      feste: eventi.map((e: Record<string, unknown>) => ({ titolo: e.title, inizio: e.starts_at, fine: e.ends_at, tutto_il_giorno: !!e.all_day, luogo: e.location || '', calendario: nomi[e.calendar_source_id as string] })),
      instagram: ig.map((p: Record<string, unknown>) => ({ id: p.id, permalink: p.permalink, quando: p.taken_at, titolo: p.titolo || '', testo: p.caption || '',
        testo_immagine: p.testo_immagine || '', alt: p.alt || '', foto: p.img_md ? URL_SB + '/storage/v1/object/public/ig-comune/' + p.img_md : '' }))
    };
    return new Response(JSON.stringify(corpo), { headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ errore: 'Non disponibile' }), { status: 502, headers: { ...cors, 'content-type': 'application/json' } });
  }
});
