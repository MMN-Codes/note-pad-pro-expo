// Load optional native modules lazily, so a module that is missing in a preview/runtime
// (e.g. Snack) disables only its own feature instead of crashing the whole app at startup.
// Always call as: tryRequire(() => require('module-name'))   (static string, Metro-safe)
export function tryRequire(loader) {
  try { return loader(); } catch (e) { return null; }
}
export const defaultOf = (m) => (m && m.default ? m.default : m);
