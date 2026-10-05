import { Platform } from 'react-native';
import { tryRequire } from './lazy';

export async function copyText(text) {
  const C = tryRequire(() => require('expo-clipboard'));
  if (C && C.setStringAsync) return C.setStringAsync(text);
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) return navigator.clipboard.writeText(text);
  throw new Error('Clipboard is not available here');
}
export async function pasteText() {
  const C = tryRequire(() => require('expo-clipboard'));
  if (C && C.getStringAsync) return C.getStringAsync();
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) return navigator.clipboard.readText();
  throw new Error('Clipboard is not available here');
}
