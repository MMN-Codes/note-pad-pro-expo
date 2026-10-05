// NoteImageManager "image_quality_mode" limits applied to the note cover photo
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

const WIDTH = { original: 2160, balanced: 1080, saver: 960 };
const QUALITY = { original: 0.92, balanced: 0.85, saver: 0.75 };

// -> uri (native file) | data URI (web) | null if cancelled
export async function pickCoverImage(mode = 'balanced') {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (r.canceled || !r.assets || !r.assets.length) return null;
  const a = r.assets[0];
  const web = Platform.OS === 'web';
  const target = web ? 800 : WIDTH[mode] || 1080; // keep browser storage small
  const actions = a.width && a.width > target ? [{ resize: { width: target } }] : [];
  const out = await ImageManipulator.manipulateAsync(a.uri, actions, {
    compress: web ? 0.7 : QUALITY[mode] || 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: web,
  });
  if (web) return `data:image/jpeg;base64,${out.base64}`;
  const dir = `${FileSystem.documentDirectory}note_images/`;
  try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch {}
  const dest = `${dir}cover_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: out.uri, to: dest });
  return dest;
}
