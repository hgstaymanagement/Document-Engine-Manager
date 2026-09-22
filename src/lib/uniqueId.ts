/**
 * Generates an id that stays unique across page reloads and across
 * multiple people/tabs — unlike a simple incrementing counter, which
 * resets to its starting value every time the module reloads (e.g. a
 * browser refresh). That's exactly what caused elements to collide: once
 * form data started persisting in Airtable across sessions, a reset
 * counter would happily hand out an id (like "el-100") that had already
 * been saved to a real element in an earlier session, silently merging
 * edits between the two and confusing React's list rendering (which keys
 * elements by this same id).
 *
 * Prefers crypto.randomUUID() (available in all modern browsers over
 * HTTPS/localhost); falls back to a timestamp + random suffix for older
 * environments.
 */
export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
