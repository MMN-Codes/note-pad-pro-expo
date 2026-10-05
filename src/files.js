// Save / share / pick files on native + web
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { b64ToBytes } from './b64';

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
  const uri = FileSystem.cacheDirectory + fname;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: base64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: fname });
}

// -> { name, text } | null (cancelled)
export async function pickTextFile() {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets || !res.assets.length) return null;
  const a = res.assets[0];
  let text;
  if (Platform.OS === 'web') text = a.file ? await a.file.text() : await (await fetch(a.uri)).text();
  else text = await FileSystem.readAsStringAsync(a.uri, { encoding: FileSystem.EncodingType.UTF8 });
  return { name: a.name, text };
}
