// NoteImageManager "image_quality_mode" limits applied to the note cover photo.
// Native modules are loaded lazily (see lazy.js).
import { Platform } from 'react-native';
import { tryRequire } from './lazy';

const WIDTH = { original: 2160, balanced: 1080, saver: 960 };
const QUALITY = { original: 0.92, balanced: 0.85, saver: 0.75 };

// -> uri (native file) | data URI (web) | null if cancelled
export async function pickCoverImage(mode = 'balanced') {
  const ImagePicker = tryRequire(() => require('expo-image-picker'));
  const Manipulator = tryRequire(() => require('expo-image-manipulator'));
  if (!ImagePicker || !Manipulator) throw new Error('Photo picker is not available in this preview');
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (r.canceled || !r.assets || !r.assets.length) return null;
  const a = r.assets[0];
  const web = Platform.OS === 'web';
  const target = web ? 800 : WIDTH[mode] || 1080; // keep browser storage small
  const actions = a.width && a.width > target ? [{ resize: { width: target } }] : [];
  const out = await Manipulator.manipulateAsync(a.uri, actions, {
    compress: web ? 0.7 : QUALITY[mode] || 0.85, format: Manipulator.SaveFormat.JPEG, base64: web,
  });
  if (web) return `data:image/jpeg;base64,${out.base64}`;
  const FS = tryRequire(() => require('expo-file-system'));
  if (!FS || !FS.Directory || !FS.File || !FS.Paths) return out.uri; // use the manipulated temp file as-is
  const dir = new FS.Directory(FS.Paths.document, 'note_images');
  try { dir.create({ intermediates: true, idempotent: true }); } catch {}
  const dest = new FS.File(dir, `cover_${Date.now()}.jpg`);
  new FS.File(out.uri).copy(dest);
  return dest.uri;
}
