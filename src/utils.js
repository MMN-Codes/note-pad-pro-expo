const p2 = (n) => String(n).padStart(2, '0');
export const fmtDate = (d) => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`; // dd/MM/yyyy
export const fmtTime = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;                       // HH:mm
export const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`;                                 // dd/MM/yyyy HH:mm

export function parseDateTime(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(s || '');
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], 0, 0);
}
// SmartMergeEngine.parseNoteTimestamp equivalent
export function parseNoteTimestamp(date, time) {
  const d = parseDateTime(`${date} ${time}`);
  return d ? d.getTime() : 0;
}
export const safeIdToLong = (id) => {
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : 0;
};
// Java String.compareTo (UTF-16 code-unit order) — used by SQL ORDER BY on TEXT columns
export const cmpStr = (a, b) => ((a ?? '') < (b ?? '') ? -1 : (a ?? '') > (b ?? '') ? 1 : 0);
// Java String.compareToIgnoreCase
export const cmpIgnoreCase = (a, b) => cmpStr((a ?? '').toUpperCase().toLowerCase(), (b ?? '').toUpperCase().toLowerCase());

// ChecklistItem.java
let _seq = 0;
export const newItem = (text = '') => ({ id: `${Date.now()}${_seq++}`, text, checked: false });
export const checklistToJson = (items) => JSON.stringify(items.map(({ id, text, checked }) => ({ id, text, checked })));
export function checklistFromJson(json) {
  if (!json || !String(json).trim()) return [];
  try {
    const arr = JSON.parse(json);
    return arr.map((o) => ({ id: String(o.id ?? newItem().id), text: o.text ?? '', checked: !!o.checked }));
  } catch { return []; }
}
export const checklistPlainSummary = (items) =>
  items.map((i) => `${i.checked ? '☑ ' : '☐ '}${i.text}`).join('\n').trim();

export const TRASH_DAYS = 30;
export const daysLeftInTrash = (trashedDate) =>
  Math.max(0, TRASH_DAYS - Math.floor((Date.now() - trashedDate) / 86400000));

// Legacy notes imported from Android hold HTML (Html.toHtml). Editor works on plain text.
export function htmlToPlain(html) {
  if (!html) return '';
  if (!/<[a-z!][^>]*>/i.test(html)) return html;
  return html
    .replace(/<img[^>]*>/gi, '[image]')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/div>|<\/h\d>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n').trim();
}
