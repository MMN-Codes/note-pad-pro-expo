// NotificationHelper.java -> expo-notifications (AlarmManager has no JS equivalent;
// repeats are pre-scheduled as a rolling window and topped up on every app start).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { parseDateTime } from './utils';

const NATIVE = Platform.OS !== 'web';
const CHANNEL = 'note_reminders';
const STEP_MINUTES = { daily: 1440, weekly: 10080, monthly: 43200 }; // same steps as Java
const WINDOW = 8; // occurrences kept scheduled for repeating reminders

if (NATIVE) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
}

export async function initNotifications() {
  if (!NATIVE) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Note Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }
}

export async function ensurePermission() {
  if (!NATIVE) return false;
  let s = await Notifications.getPermissionsAsync();
  if (!s.granted && s.canAskAgain) s = await Notifications.requestPermissionsAsync();
  return !!s.granted;
}

async function cancelFor(noteId) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.content?.data?.noteId === noteId)
       .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

const preview = (note) => {
  if (note.isLocked) return 'Tap to unlock and view'; // never leak locked content
  const t = (note.content || '').replace(/\s+/g, ' ').trim();
  return t.length > 140 ? `${t.slice(0, 140)}…` : t;
};

async function scheduleAt(note, when) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: note.title && note.title.length ? note.title : 'Note Reminder',
      body: preview(note),
      data: { noteId: note.id },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(when), channelId: CHANNEL },
  });
}

async function scheduleOccurrences(note, first) {
  const rep = note.repeatInterval || 'none';
  const count = rep === 'none' ? 1 : WINDOW;
  const step = (STEP_MINUTES[rep] || 1440) * 60000;
  for (let i = 0; i < count; i++) await scheduleAt(note, first + i * step);
}

// setSimpleReminder(): returns { ok, reason }
export async function scheduleReminder(note) {
  if (!NATIVE) return { ok: false, reason: 'unsupported' };
  const d = parseDateTime(note.reminderTime);
  if (!note.reminderTime || !d) return { ok: false, reason: 'invalid' };
  if (d.getTime() <= Date.now()) return { ok: false, reason: 'past' };
  if (!(await ensurePermission())) return { ok: false, reason: 'permission' };
  await cancelFor(note.id);
  await scheduleOccurrences(note, d.getTime());
  return { ok: true };
}

// rescheduleAfterBoot(): missed one-time reminders are dropped, repeating ones roll forward
export async function rescheduleAfterBoot(note) {
  if (!NATIVE) return false;
  try {
    const d = parseDateTime(note.reminderTime);
    if (!d) return false;
    const rep = note.repeatInterval || 'none';
    let at = d.getTime();
    const now = Date.now();
    if (at <= now) {
      if (rep === 'none') return false;
      const step = (STEP_MINUTES[rep] || 1440) * 60000;
      while (at <= now) at += step;
    }
    if (!(await Notifications.getPermissionsAsync()).granted) return false;
    await cancelFor(note.id);
    await scheduleOccurrences(note, at);
    return true;
  } catch { return false; }
}

export async function cancelReminder(noteId) {
  if (!NATIVE || !noteId) return;
  try { await cancelFor(noteId); } catch {}
}

export async function snoozeReminder(note, minutes) {
  if (!NATIVE) return false;
  try {
    if (!(await ensurePermission())) return false;
    await cancelFor(note.id);
    await scheduleAt(note, Date.now() + minutes * 60000);
    return true;
  } catch { return false; }
}

export async function rescheduleAll(notes) {
  for (const n of notes) if (n.hasReminder) await rescheduleAfterBoot(n);
}
