// BiometricPrompt (BIOMETRIC_STRONG | DEVICE_CREDENTIAL) -> expo-local-authentication
import { Platform } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';

export async function canAuthenticate() {
  if (Platform.OS === 'web') return false;
  try { return (await LocalAuth.hasHardwareAsync()) && (await LocalAuth.isEnrolledAsync()); }
  catch { return false; }
}

// -> 'ok' | 'denied' | 'unavailable'
export async function authenticate(title, subtitle) {
  if (!(await canAuthenticate())) return 'unavailable';
  try {
    const r = await LocalAuth.authenticateAsync({
      promptMessage: title, cancelLabel: 'Cancel', fallbackLabel: 'Use passcode', disableDeviceFallback: false,
    });
    return r.success ? 'ok' : 'denied';
  } catch { return 'denied'; }
}
