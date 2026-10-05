// Base64 helpers (Hermes/Snack safe, no Buffer needed)
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToB64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
    out += CH[a >> 2] + CH[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += i + 1 < bytes.length ? CH[((b & 15) << 2) | ((c ?? 0) >> 6)] : '=';
    out += i + 2 < bytes.length ? CH[c & 63] : '=';
  }
  return out;
}

export function b64ToBytes(str) {
  const clean = String(str).replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = CH.indexOf(clean[i]), e1 = CH.indexOf(clean[i + 1]);
    const e2 = i + 2 < clean.length ? CH.indexOf(clean[i + 2]) : -1;
    const e3 = i + 3 < clean.length ? CH.indexOf(clean[i + 3]) : -1;
    if (p < len) out[p++] = (e0 << 2) | (e1 >> 4);
    if (e2 >= 0 && p < len) out[p++] = ((e1 & 15) << 4) | (e2 >> 2);
    if (e3 >= 0 && p < len) out[p++] = ((e2 & 3) << 6) | e3;
  }
  return out;
}
