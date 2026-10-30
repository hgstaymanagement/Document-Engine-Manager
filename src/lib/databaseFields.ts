<<<<<<< HEAD
export interface DatabaseFieldOption {
  value: string
  label: string
=======
import { PRIMARY_DESIGNATIONS, SECONDARY_DESIGNATIONS, TERTIARY_DESIGNATIONS, slugifyDesignation } from './designations'

export interface DatabaseFieldOption {
  value: string
  label: string
  group?: 'Primary' | 'Secondary' | 'Tertiary'
>>>>>>> origin/main
}

// Single source of truth for the barangay/official fields the app can
// auto-fill. Used by the "Database field" dropdown (for Database-sourced
<<<<<<< HEAD
// elements) and by the Dynamic Text placeholder reference in the Inspector,
// so the two can never list different things.
export const DATABASE_FIELDS: DatabaseFieldOption[] = [
  { value: 'barangay_name', label: 'Barangay Name' },
  { value: 'punong_barangay', label: 'Punong Barangay' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'kagawad', label: 'Kagawad' },
]

/** Maps builder palette labels to canonical database field ids. */
export const DATABASE_PALETTE_LABELS: Record<string, string> = {
  'Barangay (database)': 'barangay_name',
  'Punong Barangay (database)': 'punong_barangay',
  'Treasurer (database)': 'treasurer',
  'Secretary (database)': 'secretary',
}

export function resolveDatabaseFieldFromPalette(label: string): string | undefined {
  return DATABASE_PALETTE_LABELS[label]
}
=======
// elements) and by the Dynamic/Rich Text placeholder reference in the
// Inspector, so the two can never list different things. The designation
// entries are generated from the same PRIMARY/SECONDARY/TERTIARY_DESIGNATIONS
// lists the officials admin UI uses, and slugified with the same function
// officialSnapshotFor's consumer (SubmissionEditor) uses to key the actual
// data — so a designation's binding id can never drift from the key its
// value is actually stored under.
export const DATABASE_FIELDS: DatabaseFieldOption[] = [
  { value: 'barangay_name', label: 'Barangay Name' },
  ...PRIMARY_DESIGNATIONS.map(label => ({ value: slugifyDesignation(label), label, group: 'Primary' as const })),
  ...SECONDARY_DESIGNATIONS.map(label => ({ value: slugifyDesignation(label), label, group: 'Secondary' as const })),
  ...TERTIARY_DESIGNATIONS.map(label => ({ value: slugifyDesignation(label), label, group: 'Tertiary' as const })),
]
>>>>>>> origin/main
