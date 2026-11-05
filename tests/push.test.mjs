// Prova vera della cifratura push: cifra con il codice del Worker e decifra come farebbe il browser (RFC 8291).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cifra, nuoveChiaviVapid, intestazioneVapid, b64u, deb64u, endpointValido } from '../public/server/push.js';

const enc = new TextEncoder();
async function hmac(k, d) {
  const key = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, d));
}
const cat = (...p) => { const o = new Uint8Array(p.reduce((n, x) => n + x.length, 0)); let i = 0; p.forEach((x) => { o.set(x, i); i += x.length; }); return o; };

async function decifra(corpo, ua, segreto) {
  const sale = corpo.slice(0, 16), idlen = corpo[20], asPub = corpo.slice(21, 21 + idlen), cifrato = corpo.slice(21 + idlen);
  const uaPub = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
  const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const condiviso = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.privateKey, 256));
  const ikm = await hmac(await hmac(segreto, condiviso), cat(enc.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])));
  const prk = await hmac(sale, ikm);
  const cek = (await hmac(prk, cat(enc.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']);
  const chiaro = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, k, cifrato));
  assert.equal(chiaro[chiaro.length - 1], 2, 'delimitatore dell\'ultimo blocco');
  return new TextDecoder().decode(chiaro.slice(0, -1));
}

test('il messaggio cifrato si decifra con le chiavi del browser', async () => {
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const segreto = crypto.getRandomValues(new Uint8Array(16));
  const p256dh = b64u(new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey)));
  const msg = JSON.stringify({ titolo: 'Acqua sospesa a Liparlati', url: '#avvisi' });
  const corpo = await cifra(msg, p256dh, b64u(segreto));
  assert.equal(await decifra(corpo, ua, segreto), msg);
});

test('JWT VAPID firmato e verificabile con la chiave pubblica', async () => {
  const v = await nuoveChiaviVapid();
  assert.equal(deb64u(v.publicKey).length, 65);
  const h = await intestazioneVapid('https://fcm.googleapis.com/fcm/send/abc', v, 'https://positano-app.crescy.workers.dev');
  const [, t, k] = h.match(/^vapid t=([^,]+), k=(.+)$/);
  assert.equal(k, v.publicKey);
  const [a, b, s] = t.split('.');
  const corpo = JSON.parse(new TextDecoder().decode(deb64u(b)));
  assert.equal(corpo.aud, 'https://fcm.googleapis.com');
  const pub = await crypto.subtle.importKey('raw', deb64u(v.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  assert.ok(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, deb64u(s), enc.encode(a + '.' + b)));
});

test('solo i servizi push dei browser', () => {
  assert.ok(endpointValido('https://fcm.googleapis.com/fcm/send/x'));
  assert.ok(endpointValido('https://web.push.apple.com/abc'));
  assert.ok(endpointValido('https://updates.push.services.mozilla.com/wpush/v2/x'));
  assert.ok(!endpointValido('http://fcm.googleapis.com/x'));
  assert.ok(!endpointValido('https://evil.example.com/fcm.googleapis.com'));
  assert.ok(!endpointValido('https://fcm.googleapis.com.evil.com/x'));
});

test('identico al vettore di prova dell\'RFC 8291 (appendice A)', async () => {
  const asPub = deb64u('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8');
  const jwk = { kty: 'EC', crv: 'P-256', d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', x: b64u(asPub.slice(1, 33)), y: b64u(asPub.slice(33, 65)), ext: true };
  const privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const publicKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  const out = await cifra('When I grow up, I want to be a watermelon', 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg', { chiaveEffimera: { privateKey, publicKey }, sale: deb64u('DGv6ra1nlYgDCS1FRnbzlw') });
  assert.equal(b64u(out), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
});
