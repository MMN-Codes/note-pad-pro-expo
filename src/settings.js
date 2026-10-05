// SharedPreferences "ThemePrefs" + "AppPrefs" -> AsyncStorage (same keys & defaults)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODE, PACK } from './theme';

const KEY = 'NPP_settings_v1';
export const DEFAULTS = {
  mode: MODE.SYSTEM,          // ThemeHelper default THEME_SYSTEM
  pack: PACK.CLASSIC,         // ThemeHelper default PACK_CLASSIC
  auto_save: true,            // AppPrefs.auto_save
  biometric_lock: false,      // AppPrefs.biometric_lock (app-level lock on launch)
  skip_splash: false,         // AppPrefs.skip_splash
  image_quality_mode: 'balanced',
  intro_done: false,
  note_font_size_sp: 16,      // AddEditNoteActivity note_font_size_sp (14..26)
};
export async function loadSettings() {
  try { const raw = await AsyncStorage.getItem(KEY); return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) }; }
  catch { return { ...DEFAULTS }; }
}
export const saveSettings = (s) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
