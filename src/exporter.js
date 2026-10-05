// ExportFormatter.java — one .md per note (YAML front-matter), zipped.
import { defaultOf, tryRequire } from './lazy';
import { safeName } from './files';

const orDash = (v) => (v == null || v === '' ? '-' : v);

export function buildMarkdown(note) {
  const title = note.title && note.title.trim() ? note.title.trim() : 'Untitled';
  let s = '---\n';
  s += `title: "${title.replace(/"/g, '\\"')}"\n`;
  s += `date: ${orDash(note.date)}\ntime: ${orDash(note.time)}\n`;
  if (note.hasReminder && note.reminderTime) s += `reminder: ${note.reminderTime}\n`;
  s += `locked: ${!!note.isLocked}\npinned: ${!!note.isPinned}\n---\n\n# ${title}\n\n`;
  if (note.content && note.content.trim()) s += `${note.content.trim()}\n\n`;
  if (note.isLocked) s += '\n> Note: This note was password-protected in Note Pad Pro.\n';
  return s;
}

export function markdownFileName(note) {
  const base = safeName(note.title && note.title.trim());
  return `${base || `note_${note.id || Date.now()}`}.md`;
}

// -> { base64, exported, skippedLocked }
export async function buildMarkdownZip(notes, includeLocked) {
  const JSZip = defaultOf(tryRequire(() => require('jszip')));
  if (!JSZip) throw new Error('ZIP library is not available in this preview');
  const zip = new JSZip();
  const used = new Set();
  let exported = 0, skippedLocked = 0;
  for (const n of notes) {
    if (n.isLocked && !includeLocked) { skippedLocked++; continue; }
    const base = safeName(n.title && n.title.trim()) || `note_${n.id}`;
    let name = `${base}.md`, k = 2;
    while (used.has(name)) name = `${base}_${k++}.md`;
    used.add(name);
    zip.file(name, buildMarkdown(n));
    exported++;
  }
  const base64 = await zip.generateAsync({ type: 'base64' });
  return { base64, exported, skippedLocked };
}
