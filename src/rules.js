// MainActivity.filterNotes() / applySort() / NotesAdapter preview rules, unchanged.
import { checklistFromJson } from './utils';
import { safeIdToLong, cmpIgnoreCase } from './utils';

export const SORTS = { NEWEST: 'NEWEST', OLDEST: 'OLDEST', TITLE_AZ: 'TITLE_AZ', TITLE_ZA: 'TITLE_ZA' };

// title OR content contains query (case-insensitive); empty query -> everything
export function filterNotes(notes, query) {
  if (!query) return notes.slice();
  const q = query.toLowerCase();
  return notes.filter((n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
}

// pinned block first, then the rest; each block sorted by the chosen comparator
export function applySort(notes, sort) {
  const cmp = {
    [SORTS.OLDEST]: (a, b) => safeIdToLong(a.id) - safeIdToLong(b.id),
    [SORTS.TITLE_AZ]: (a, b) => cmpIgnoreCase(a.title, b.title),
    [SORTS.TITLE_ZA]: (a, b) => cmpIgnoreCase(b.title, a.title),
    [SORTS.NEWEST]: (a, b) => safeIdToLong(b.id) - safeIdToLong(a.id),
  }[sort] || ((a, b) => safeIdToLong(b.id) - safeIdToLong(a.id));
  const pinned = notes.filter((n) => n.isPinned).sort(cmp);
  const rest = notes.filter((n) => !n.isPinned).sort(cmp);
  return [...pinned, ...rest];
}

// NotesAdapter: checklist -> first 3 items + "+N more"; text -> 100 chars + "..."
export function notePreview(note) {
  if (note.isLocked) return '🔒 Locked note';
  if (note.isChecklist) {
    const items = checklistFromJson(note.checklistJson);
    let s = items.slice(0, 3).map((i) => `${i.checked ? '☑ ' : '☐ '}${i.text}`).join('   ');
    if (items.length > 3) s += `   +${items.length - 3} more`;
    return s.trim();
  }
  const text = note.content || '';
  return text.length > 100 ? `${text.substring(0, 100)}...` : text;
}
export const checklistProgress = (note) => {
  const items = checklistFromJson(note.checklistJson);
  return { done: items.filter((i) => i.checked).length, total: items.length };
};
