// SnapshotRotator.java — 3 rotating automatic snapshots (slot 1 = newest)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildBackupJson } from './backupCore';

const META = 'NPP_snapshots_meta';
const DATA = (ts) => `NPP_snap_${ts}`;
const SLOTS = 3;
const MIN_GAP_MS = 10 * 60 * 1000;
const MAX_CHARS = 700000; // keep each snapshot small enough for AsyncStorage / browser storage

export async function listSnapshots() {
  try { const raw = await AsyncStorage.getItem(META); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; }
  catch { return []; }
}
export async function readSnapshot(ts) { try { return await AsyncStorage.getItem(DATA(ts)); } catch { return null; } }

export async function maybeSnapshot() {
  try {
    const metas = await listSnapshots();
    const json = await buildBackupJson();
    const parsed = JSON.parse(json);
    if (!parsed.note_count || json.length > MAX_CHARS) return false;
    const sig = `${parsed.note_count}:${Math.max(0, ...parsed.notes.map((n) => n.last_modified || 0))}`;
    const newest = metas[0];
    if (newest && (newest.sig === sig || Date.now() - newest.ts < MIN_GAP_MS)) return false;
    const ts = Date.now();
    await AsyncStorage.setItem(DATA(ts), json);
    const next = [{ ts, count: parsed.note_count, sig }, ...metas];
    const dropped = next.slice(SLOTS);
    await AsyncStorage.setItem(META, JSON.stringify(next.slice(0, SLOTS)));
    for (const m of dropped) await AsyncStorage.removeItem(DATA(m.ts));
    return true;
  } catch { return false; }
}
