// Save / share / pick files on native + web. Native modules are loaded lazily (see lazy.js).
import { Platform, Share } from 'react-native';
import { b64ToBytes } from './b64';
import { tryRequire } from './lazy';

export const safeName = (n) => String(n || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);

// content: string (utf8) or base64 string when opts.base64 = true
export async function shareFile(name, content, { base64 = false, mime = 'application/octet-stream' } = {}) {
  const fname = safeName(name) || 'file';
  if (Platform.OS === 'web') {
    const blob = new Blob([base64 ? b64ToBytes(content) : content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return;
  }
  const FS = tryRequire(() => require('expo-file-system'));
  const Sharing = tryRequire(() => require('expo-sharing'));
  if (!FS || !Sharing || !FS.File || !FS.Paths) {
    // preview without file modules: text can still be shared through the system share sheet
    if (base64) throw new Error('Sharing files needs the full app build (not available in this preview)');
    await Share.share({ title: fname, message: content });
    return;
  }
  const file = new FS.File(FS.Paths.cache, fname);
  file.create({ overwrite: true });
  file.write(base64 ? b64ToBytes(content) : content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: fname });
}

// -> { name, text } | null (cancelled)
export async function pickTextFile() {
  const Picker = tryRequire(() => require('expo-document-picker'));
  if (!Picker) throw new Error('File picker is not available here — paste the backup text instead');
  const res = await Picker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets || !res.assets.length) return null;
  const a = res.assets[0];
  let text;
  if (Platform.OS === 'web') text = a.file ? await a.file.text() : await (await fetch(a.uri)).text();
  else {
    const FS = tryRequire(() => require('expo-file-system'));
    if (FS && FS.File) text = await new FS.File(a.uri).text();
    else text = await (await fetch(a.uri)).text();
  }
  return { name: a.name, text };
}
