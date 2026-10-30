<<<<<<< HEAD
// Core domain types for LIGA Bulan Document Manager
// Mirrors the MVP spec: Barangays/Officials, Clients, Access,
=======
// Core domain types for LIGA Bulan Document Engine Manager
// Mirrors the MVP spec: Barangays/Officials (Airtable), Clients, Access,
>>>>>>> origin/main
// Forms (versioned document schema), Submissions (JSON payload).

export type Role = 'admin' | 'client'

export interface Official {
  id: string
  barangayId: string
<<<<<<< HEAD
  position: 'Punong Barangay' | 'Treasurer' | 'Secretary' | 'Kagawad' | string
=======
  position: string // primary designation — e.g. Punong Barangay, Secretary, Treasurer, Kagawad 1-8
  secondaryDesignation?: string // e.g. BAC Chairman, BAC Member 1-6, BAC Secretariat
  tertiaryDesignation?: string // e.g. Committee on Appropriations, etc.
>>>>>>> origin/main
  name: string
}

export interface Barangay {
  id: string
  name: string
}

export interface Client {
  id: string
  name: string
  loginId: string
<<<<<<< HEAD
=======
  password: string
>>>>>>> origin/main
  active: boolean
  barangayIds: string[]
}

export type FieldSource = 'database' | 'input' | 'calculated' | 'dynamic_text'

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'signature'
  | 'printed_name'
  | 'position'
  | 'date_signed'
  | 'static_text'
  | 'section_heading'
  | 'dynamic_text'
<<<<<<< HEAD
=======
  | 'rich_text'
>>>>>>> origin/main
  | 'image'
  | 'page_break'
  | 'table'

export type BorderPreset =
  | 'none'
  | 'outside'
  | 'all'
  | 'inside'
  | 'top_bottom'
  | 'bottom_only'
  | 'section_box'
  | 'table_grid'

export interface BorderStyle {
  preset: BorderPreset
  thickness: number // px
  color: string
  radius: number
}

export interface DynamicTextToken {
<<<<<<< HEAD
  type: 'text' | 'field'
  value?: string
  fieldId?: string
=======
  type: 'text' | 'field' | 'blank'
  value?: string // for 'text'
  fieldId?: string // for 'field' — a database field or another element's id
  blankId?: string // for 'blank' — the key its fillable value is stored under
  blankLabel?: string // for 'blank' — shown in the fill-form sidebar and as an in-place placeholder
>>>>>>> origin/main
}

export type TableColumnType = 'short_text' | 'number' | 'currency' | 'date' | 'dropdown' | 'checkbox' | 'calculated'

export interface TableColumn {
  id: string
  label: string
  width: number
  type: TableColumnType
  options?: string[] // only used when type === 'dropdown'
  formula?: string // only used when type === 'calculated', e.g. "qty * unit_price"
  paragraphStyle?: ParagraphStyle // alignment/indent/list/hyphenation for this column's cells
  textStyle?: TextStyle // font family/size for this column's cells
  summarize?: boolean // if true, a footer row sums this column across every row
}

export interface ParagraphStyle {
  align: 'left' | 'center' | 'right' | 'justify'
  indent: number // px, first-line indent
  listType: 'none' | 'bullet' | 'numbered'
  hyphenate: boolean
  lineHeight: number // e.g. 1, 1.15, 1.5, 2
}

export interface TextStyle {
<<<<<<< HEAD
  fontFamily: string // key into FONT_FAMILIES (src/lib/textStyle.ts)
  fontSize: number // px
=======
  fontFamily?: string // key into FONT_FAMILIES (src/lib/textStyle.ts) — omitted means "inherit from parent"
  fontSize?: number // px — omitted means "inherit from parent"
>>>>>>> origin/main
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
}

export interface FormElement {
  id: string
  type: FieldType
  label: string
  source: FieldSource
  x: number // grid column start (0-11)
  y: number // row index within page
  w: number // width in columns
  h: number // height in rows
  page: number
  required?: boolean
  options?: string[] // dropdown/radio
  databaseField?: string // e.g. 'punong_barangay'
  formula?: string // for calculated fields
<<<<<<< HEAD
  tokens?: DynamicTextToken[] // for dynamic_text
  paragraphStyle?: ParagraphStyle // for dynamic_text, static_text, section_heading
  textStyle?: TextStyle // font family/size — for dynamic_text, static_text, section_heading
=======
  tokens?: DynamicTextToken[] // for dynamic_text, rich_text
  blankStyles?: Record<string, TextStyle> // per-blank font style (bold/italic/underline), keyed by blankId
  paragraphStyle?: ParagraphStyle // for dynamic_text, rich_text, static_text, section_heading
  textStyle?: TextStyle // font family/size — for dynamic_text, rich_text, static_text, section_heading
>>>>>>> origin/main
  border?: BorderStyle
  columns?: TableColumn[] // for table type — each column is its own basic-input field
  placeholder?: string
}

export interface FormPageLayout {
  size: 'A4' | 'Letter' | 'Legal' | 'Folio'
  orientation: 'portrait' | 'landscape'
  margins: { top: number; right: number; bottom: number; left: number }
}

export interface FormVersion {
  version: number
  createdAt: string
  page: FormPageLayout
  elements: FormElement[]
  changeNote?: string
}

export interface ProcurementForm {
  id: string
  name: string
  description: string
  category: string
  currentVersion: number
  versions: FormVersion[]
  published: boolean
  updatedAt: string
}

export type SubmissionStatus = 'draft' | 'submitted'

export interface Submission {
  id: string
  formId: string
  formVersion: number
  barangayId: string
  clientId: string
  status: SubmissionStatus
  data: Record<string, string | number | boolean>
  tables?: Record<string, Record<string, string>[]> // table element id -> its filled rows
  officialSnapshot: Record<string, string> // frozen official names at time of fill
  createdAt: string
  updatedAt: string
  submittedAt?: string
}
