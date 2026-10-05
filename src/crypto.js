// BackupCrypto.java "PASSWORD MODE" — same envelope, so password backups are interchangeable
// with the Android app:  { mode:"password", kdf:"PBKDF2WithHmacSHA256", iterations:150000,
// salt, iv, data }  (AES-256-GCM, 128-bit tag appended to the ciphertext, base64 NO_WRAP).
import { Platform } from 'react-native';
import { tryRequire } from './lazy';
import { b64ToBytes, bytesToB64 } from './b64';

export const MODE_PASSWORD = 'password';
const KDF = 'PBKDF2WithHmacSHA256';
const ITERATIONS_HIGH = 150000;
const MODES = ['keystore', 'password', 'device', 'account'];
const noble = () => {
  const kdf = tryRequire(() => require('@noble/hashes/pbkdf2.js'));
  const sha = tryRequire(() => require('@noble/hashes/sha2.js'));
  const aes = tryRequire(() => require('@noble/ciphers/aes.js'));
  if (!kdf || !sha || !aes) throw new Error('Encryption library is not available in this preview');
  return { pbkdf2Async: kdf.pbkdf2Async, sha256: sha.sha256, gcm: aes.gcm };
};
function randomBytes(n) {
  const g = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (g && g.getRandomValues) return g.getRandomValues(new Uint8Array(n));
  const E = tryRequire(() => require('expo-crypto'));
  if (E && E.getRandomBytes) return E.getRandomBytes(n);
  throw new Error('Secure random generator is not available here');
}
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt, iterations) {
  const subtle = typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle;
  if (Platform.OS === 'web' && subtle) {
    const material = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256);
    return new Uint8Array(bits);
  }
  // pure JS, async variant yields to the UI thread so the app does not freeze
  const { pbkdf2Async, sha256 } = noble();
  return pbkdf2Async(sha256, enc.encode(password), salt, { c: iterations, dkLen: 32, asyncTick: 8 });
}

export async function encryptWithPassword(plainText, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, ITERATIONS_HIGH);
  const { gcm } = noble();
  const cipher = gcm(key, iv).encrypt(enc.encode(plainText));
  return JSON.stringify({
    mode: MODE_PASSWORD, kdf: KDF, iterations: ITERATIONS_HIGH,
    salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(cipher),
  });
}

// returns plaintext, or null on wrong password / corrupted file
export async function decryptWithPassword(envelopeJson, password) {
  try {
    const e = JSON.parse(envelopeJson);
    if (e.mode !== MODE_PASSWORD) return null;
    const key = await deriveKey(password, b64ToBytes(e.salt), Number(e.iterations) || ITERATIONS_HIGH);
    const { gcm } = noble();
    return dec.decode(gcm(key, b64ToBytes(e.iv)).decrypt(b64ToBytes(e.data)));
  } catch { return null; }
}

export function envelopeMode(text) {
  try { const o = JSON.parse(text); return o && MODES.includes(o.mode) ? o.mode : null; } catch { return null; }
}
export const isEncryptedEnvelope = (text) => envelopeMode(text) !== null;
