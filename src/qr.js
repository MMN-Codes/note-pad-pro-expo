// NoteQrHelper.java — QR content = "<landing>#<base64url(gzip(json {v,t,c}))>"
import { defaultOf, tryRequire } from './lazy';
import { b64ToBytes, bytesToB64 } from './b64';

export const MAX_QR_CONTENT_CHARS = 1300;
export const LANDING_URL = 'https://note-pad-pro.vercel.app/n';
const urlSafe = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlSafe = (s) => { let t = s.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; return t; };

const getPako = () => { const p = defaultOf(tryRequire(() => require('pako'))); if (!p) throw new Error('Compression library is not available'); return p; };

export function buildQrContent(note) {
  const pako = getPako();
  const json = JSON.stringify({ v: 1, t: note.title || '', c: note.content || '' });
  const gz = pako.gzip(new TextEncoder().encode(json));
  return `${LANDING_URL}#${urlSafe(bytesToB64(gz))}`;
}
export const isQrContentTooLarge = (s) => !s || s.length > MAX_QR_CONTENT_CHARS;

// -> { title, content } | null
export function decodeScannedText(text) {
  if (!text) return null;
  const pako = getPako();
  let payload = String(text).trim();
  const i = payload.indexOf('#');
  if (i !== -1 && i + 1 < payload.length) payload = payload.slice(i + 1).trim();
  try {
    const json = JSON.parse(new TextDecoder().decode(pako.ungzip(b64ToBytes(fromUrlSafe(payload)))));
    return { title: json.t || 'Imported Note', content: json.c || '' };
  } catch { return null; }
}
