export interface DatabaseFieldOption {
  value: string
  label: string
}

// Single source of truth for the barangay/official fields the app can
// auto-fill. Used by the "Database field" dropdown (for Database-sourced
// elements) and by the Dynamic Text placeholder reference in the Inspector,
// so the two can never list different things.
export const DATABASE_FIELDS: DatabaseFieldOption[] = [
  { value: 'barangay_name', label: 'Barangay Name' },
  { value: 'punong_barangay', label: 'Punong Barangay' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'kagawad', label: 'Kagawad' },
]
