// AddEditNoteActivity NOTE_LINK_PATTERN:  [[Title]]  or  ((Title))   (1..100 chars)
export const MAX_NOTE_LINKS = 50;
const make = () => /\[\[([^\]]{1,100})\]\]|\(\(([^)]{1,100})\)\)/g;

// -> [{ text, link }]  (link = trimmed target title, or undefined for plain text)
export function splitLinks(text) {
  const out = [];
  const re = make();
  let last = 0, m, n = 0;
  while ((m = re.exec(text || '')) && n < MAX_NOTE_LINKS) {
    const title = (m[1] ?? m[2] ?? '').trim();
    if (!title) continue;
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], link: title });
    last = m.index + m[0].length;
    n++;
  }
  if (last < (text || '').length) out.push({ text: text.slice(last) });
  return out;
}
export const extractLinkTitles = (text) =>
  [...new Set(splitLinks(text).filter((p) => p.link).map((p) => p.link))];
