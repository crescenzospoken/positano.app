/* Positano.app · notifiche push senza librerie esterne (Web Push standard).
   - Chiavi VAPID (RFC 8292) generate dal Worker al primo uso e salvate in D1: nessun segreto nel codice.
   - Cifratura del messaggio aes128gcm (RFC 8291 + RFC 8188), con WebCrypto.
   Funziona uguale nel Worker e in Node (i test cifrano e decifrano davvero). */

const enc = new TextEncoder();

export function b64u(buf) {
  const a = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function deb64u(s) {
  const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4));
  const a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
function unisci() {
  const parti = Array.prototype.slice.call(arguments);
  const tot = parti.reduce(function (n, p) { return n + p.length; }, 0);
  const out = new Uint8Array(tot);
  let o = 0;
  parti.forEach(function (p) { out.set(p, o); o += p.length; });
  return out;
}
async function hmac(chiave, dati) {
  const k = await crypto.subtle.importKey('raw', chiave, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, dati));
}

/* Coppia di chiavi VAPID: { publicKey (base64url, 65 byte grezzi), privateJwk } */
export async function nuoveChiaviVapid() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  return { publicKey: b64u(pub), privateJwk: jwk };
}

/* JWT ES256 per l'intestazione Authorization: vapid t=…, k=… */
export async function intestazioneVapid(endpoint, vapid, soggetto) {
  const aud = new URL(endpoint).origin;
  const testa = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const corpo = b64u(enc.encode(JSON.stringify({ aud: aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: soggetto })));
  const k = await crypto.subtle.importKey('jwk', vapid.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, enc.encode(testa + '.' + corpo)));
  return 'vapid t=' + testa + '.' + corpo + '.' + b64u(firma) + ', k=' + vapid.publicKey;
}

/* Cifra il messaggio per un'iscrizione { p256dh, auth }. Restituisce il corpo binario da inviare. */
export async function cifra(messaggio, p256dh, auth, opzioni) {
  const uaPub = deb64u(p256dh), segreto = deb64u(auth);
  const o = opzioni || {};
  const eph = o.chiaveEffimera || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const condiviso = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const prkKey = await hmac(segreto, condiviso);
  const ikm = await hmac(prkKey, unisci(enc.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])));
  const sale = o.sale || crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(sale, ikm);
  const cek = (await hmac(prk, unisci(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, unisci(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const testo = unisci(typeof messaggio === 'string' ? enc.encode(messaggio) : messaggio, new Uint8Array([2]));
  const k = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const cifrato = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, testo));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return unisci(sale, rs, new Uint8Array([asPub.length]), asPub, cifrato);
}

/* Invia una notifica. Esito: 'ok' | 'rimuovi' (iscrizione scaduta) | 'errore' */
export async function invia(iscrizione, messaggio, vapid, soggetto) {
  try {
    const corpo = await cifra(JSON.stringify(messaggio), iscrizione.p256dh, iscrizione.auth);
    const r = await fetch(iscrizione.endpoint, {
      method: 'POST',
      headers: { authorization: await intestazioneVapid(iscrizione.endpoint, vapid, soggetto), ttl: '86400', urgency: 'normal',
        'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream' },
      body: corpo
    });
    if (r.status === 404 || r.status === 410) return 'rimuovi';
    return r.ok ? 'ok' : 'errore';
  } catch (e) {
    return 'errore';
  }
}

/* Solo i servizi push dei browser: niente indirizzi arbitrari (il Worker non deve diventare un proxy). */
export function endpointValido(u) {
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') return false;
    return /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com|push\.api\.chromium\.org)$/.test(x.hostname);
  } catch (e) { return false; }
}
