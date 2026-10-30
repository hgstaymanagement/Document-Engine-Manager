// Single source of truth for every designation a barangay official can
// hold. Officials CRUD (dropdowns), the official snapshot used when a form
// is submitted, and the Dynamic/Rich Text "Database fields" binding picker
// all read from these same lists — so a designation can't exist in one
// place and not the other.

export const PRIMARY_DESIGNATIONS: string[] = [
  'Punong Barangay',
  'Secretary',
  'Treasurer',
  'Kagawad 1',
  'Kagawad 2',
  'Kagawad 3',
  'Kagawad 4',
  'Kagawad 5',
  'Kagawad 6',
  'Kagawad 7',
  'Kagawad 8',
]

export const SECONDARY_DESIGNATIONS: string[] = [
  'BAC Chairman',
  'BAC Member 1',
  'BAC Member 2',
  'BAC Member 3',
  'BAC Member 4',
  'BAC Member 5',
  'BAC Member 6',
  'BAC Secretariat',
]

export const TERTIARY_DESIGNATIONS: string[] = [
  'Committee on Appropriations',
  'Committee on Health and Social Services',
  'Committee on Peace and Order / Human Rights',
  'Committee on Environmental Protection / Services',
  'Committee on Women, Children, Family, and Senior Citizens',
  'Committee on Youth and Sports Development',
  'Committee on Infrastructure / Public Works',
  'Committee on Agriculture and Livelihood',
]

/**
 * Turns any designation label into a clean, {{field_id}}-safe key: lowercase,
 * runs of anything that isn't a letter/digit collapsed to a single
 * underscore, no leading/trailing underscore. Needed because several
 * tertiary committee names contain "/" and "," — characters the template
 * parser's {{field_id}} regex (letters/digits/underscore/hyphen only)
 * can't accept — so the raw label can never be used as a placeholder key
 * directly. Used both to build the binding picker's field ids and to key
 * the official snapshot each submission stores, so the two can never
 * silently drift out of sync with each other.
 */
export function slugifyDesignation(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
