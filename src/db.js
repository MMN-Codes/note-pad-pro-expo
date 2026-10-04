// DatabaseHelper.java (SQLite "notes_db" v8) -> AsyncStorage with the SAME columns/rules.
// Every row keeps the original snake_case column names so an export from the Android
// SQLite DB can be imported 1:1. Writes are serialized through a promise chain.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelReminder, rescheduleAfterBoot } from './notify';
import { cmpStr, parseNoteTimestamp } from './utils';

const DB_KEY = 'notes_db';
export const DATABASE_VERSION = 8;

let rows = null;
let chain = Promise.resolve();

async function ensure() {
  if (rows) return;
  try { const raw = await AsyncStorage.getItem(DB_KEY); rows = raw ? JSON.parse(raw) : []; } catch { rows = []; }
  if (!Array.isArray(rows)) rows = [];
}
const persist = () => AsyncStorage.setItem(DB_KEY, JSON.stringify(rows));
const write = (fn) => {
  const run = chain.then(async () => { await ensure(); const r = await fn(); await persist(); return r; });
  chain = run.catch(() => {});
  return run;
};
const read = (fn) => chain.then(async () => { await ensure(); return fn(); });

// ---- Note model (Note.java) --------------------------------------------------------
export function newNote(title = '', content = '', date = '', time = '') {
  return {
    id: String(Date.now()), title, content, date, time,
    reminderTime: null, hasReminder: false, isPinned: false, isLocked: false,
    trashedDate: 0, lastModified: 0, bgStyle: 'none',
    isChecklist: false, checklistJson: null, coverImagePath: null, repeatInterval: 'none',
  };
}
const toRow = (n, deleted = 0, trashed = 0, lastModified = 0) => ({
  id: n.id, title: n.title, content: n.content, date: n.date, time: n.time,
  reminder_time: n.reminderTime ?? null, has_reminder: n.hasReminder ? 1 : 0,
  is_pinned: n.isPinned ? 1 : 0, is_deleted: deleted, is_locked: n.isLocked ? 1 : 0,
  trashed_date: trashed, bg_style: n.bgStyle || 'none',
  is_checklist: n.isChecklist ? 1 : 0, checklist_json: n.checklistJson ?? null,
  repeat_interval: n.repeatInterval || 'none', cover_image_path: n.coverImagePath ?? null,
  last_modified: lastModified,
});
const toNote = (r) => ({
  id: r.id, title: r.title, content: r.content, date: r.date, time: r.time,
  reminderTime: r.reminder_time, hasReminder: r.has_reminder === 1,
  isPinned: r.is_pinned === 1, isLocked: r.is_locked === 1,
  trashedDate: r.trashed_date || 0, lastModified: r.last_modified || 0,
  bgStyle: r.bg_style || 'none', isChecklist: r.is_checklist === 1,
  checklistJson: r.checklist_json ?? null, coverImagePath: r.cover_image_path ?? null,
  repeatInterval: r.repeat_interval || 'none',
});

// nextStamp(): sync timestamp that never goes backwards
function nextStamp(row) {
  const now = Date.now();
  let prev = row ? row.last_modified || 0 : 0;
  if (row && prev <= 0) prev = parseNoteTimestamp(row.date, row.time);
  return Math.max(now, prev + 1);
}
const find = (id) => rows.find((r) => r.id === id);

// ---- Create ------------------------------------------------------------------------
export const addNote = (note) => write(() => {
  rows.push(toRow(note, 0, 0, note.lastModified > 0 ? note.lastModified : Date.now()));
});

export const addNoteWithTrashState = (note, isTrashed) => write(() => {
  rows.push(toRow(note, isTrashed ? 1 : 0, isTrashed ? Date.now() : 0,
    note.lastModified > 0 ? note.lastModified : parseNoteTimestamp(note.date, note.time)));
});

// ---- Read --------------------------------------------------------------------------
export const getNote = (id) => read(() => { const r = find(id); return r ? toNote(r) : null; });
export const isNoteTrashed = (id) => read(() => { const r = find(id); return !!r && r.is_deleted === 1; });
export const getNoteCount = () => read(() => rows.length);

// ORDER BY is_pinned DESC, date DESC, time DESC  (TEXT comparison, as SQLite does)
export const getAllNotes = () => read(() =>
  rows.filter((r) => r.is_deleted === 0)
    .sort((a, b) => (b.is_pinned - a.is_pinned) || cmpStr(b.date, a.date) || cmpStr(b.time, a.time))
    .map(toNote));

// WHERE has_reminder = 1 AND is_deleted = 0 ORDER BY reminder_time ASC
export const getNotesWithReminders = () => read(() =>
  rows.filter((r) => r.has_reminder === 1 && r.is_deleted === 0)
    .sort((a, b) => cmpStr(a.reminder_time, b.reminder_time)).map(toNote));

// WHERE is_deleted = 1 ORDER BY trashed_date ASC (most urgent first)
export const getTrashNotes = () => read(() =>
  rows.filter((r) => r.is_deleted === 1).sort((a, b) => a.trashed_date - b.trashed_date).map(toNote));

export const getNoteCountsByDate = () => read(() => {
  const m = {};
  for (const r of rows) if (r.is_deleted === 0 && r.date != null) m[r.date] = (m[r.date] || 0) + 1;
  return m;
});
export const getNotesByExactDate = (date) => read(() =>
  rows.filter((r) => r.is_deleted === 0 && r.date === date).sort((a, b) => cmpStr(b.time, a.time)).map(toNote));

export const findNoteByTitle = (title) => read(() => {
  if (title == null) return null;
  const t = title.trim().toLowerCase();
  const r = rows.find((x) => x.is_deleted === 0 && (x.title || '').toLowerCase() === t);
  return r ? toNote(r) : null;
});

// ---- Update ------------------------------------------------------------------------
export const updateNote = (note) => write(() => {
  const r = find(note.id);
  if (!r) return 0;
  Object.assign(r, toRow(note, r.is_deleted, r.trashed_date, nextStamp(r)));
  return 1;
});

export const setNoteLocked = (id, locked) => write(() => {
  const r = find(id);
  if (!r) return false;
  r.is_locked = locked ? 1 : 0;
  r.last_modified = nextStamp(r);
  return true;
});

export const setNotePinned = (id, pinned) => write(() => {
  const r = find(id);
  if (!r) return false;
  r.is_pinned = pinned ? 1 : 0;
  r.last_modified = nextStamp(r);
  return true;
});

// ---- Trash -------------------------------------------------------------------------
export const moveToTrash = async (id) => {
  const ok = await write(() => {
    const r = find(id);
    if (!r) return false;
    r.is_deleted = 1; r.trashed_date = Date.now(); r.last_modified = nextStamp(r);
    return true;
  });
  if (ok) await cancelReminder(id);
  return ok;
};

export const restoreFromTrash = async (id) => {
  const ok = await write(() => {
    const r = find(id);
    if (!r) return false;
    r.is_deleted = 0; r.trashed_date = 0; // fresh 30-day timer if re-trashed later
    r.last_modified = nextStamp(r);
    return true;
  });
  if (ok) {
    const n = await getNote(id);
    if (n && n.hasReminder) await rescheduleAfterBoot(n);
  }
  return ok;
};

export const deleteNote = async (id) => {
  await cancelReminder(id);
  await write(() => { rows = rows.filter((r) => r.id !== id); });
};

export const deleteAllNotes = async () => {
  const ids = await read(() => rows.filter((r) => r.has_reminder === 1).map((r) => r.id));
  await write(() => { rows = []; });
  for (const id of ids) await cancelReminder(id);
};

export const emptyTrash = async () => {
  const ids = await read(() => rows.filter((r) => r.is_deleted === 1).map((r) => r.id));
  for (const id of ids) await cancelReminder(id);
  await write(() => { rows = rows.filter((r) => r.is_deleted !== 1); });
};

// purgeOldTrash(): 30+ days in trash -> permanently deleted. Returns purged ids.
export const purgeOldTrash = async () => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const ids = await read(() => rows
    .filter((r) => r.is_deleted === 1 && r.trashed_date > 0 && r.trashed_date < cutoff).map((r) => r.id));
  for (const id of ids) await cancelReminder(id);
  await write(() => { rows = rows.filter((r) => !ids.includes(r.id)); });
  return ids;
};
