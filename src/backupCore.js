// BackupManager.java JSON format + restore/merge
import { exportAllRows, getNotesWithReminders, importRows } from './db';
import { rescheduleAll } from './notify';

export const SCHEMA_VERSION = 1;
const p2 = (n) => String(n).padStart(2, '0');

export async function buildBackupJson() {
  const notes = await exportAllRows();
  const d = new Date();
  return JSON.stringify({
    app_name: 'Note Pad Pro', schema_version: SCHEMA_VERSION,
    backup_date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`,
    note_count: notes.length, notes, images: {}, tombstones: [],
  }, null, 2);
}

export function backupFileName(ext = 'json') {
  const d = new Date();
  return `NotePadPro_Backup_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}.${ext}`;
}

// -> { added, updated, skipped }
export async function restoreFromJsonText(text) {
  let data;
  try { data = JSON.parse(String(text).trim()); } catch { throw new Error('Not a valid backup file'); }
  if (!data || !Array.isArray(data.notes)) throw new Error('Not a Note Pad Pro backup');
  if (data.schema_version && data.schema_version > SCHEMA_VERSION) throw new Error('This backup was made by a newer app version');
  const r = await importRows(data.notes);
  await rescheduleAll(await getNotesWithReminders());
  return r;
}
