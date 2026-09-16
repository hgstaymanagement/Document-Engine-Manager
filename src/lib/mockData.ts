// NOTE: as of the Airtable integration, this file is no longer imported by
// the live app — every screen now reads/writes through src/lib/airtableStore.tsx.
// Kept as a reference for the original seed-data generation logic (the same
// deterministic barangay/official names used when the Airtable base was
// first populated), in case you want to regenerate or extend seed data later.
import type {
  Barangay,
  Official,
  Client,
  ProcurementForm,
  Submission,
} from './types'

// --- 63 barangays of the Municipality of Bulan, Sorsogon (representative set) ---
const barangayNames = [
  'Abas', 'Bical', 'Bagacay', 'Bagoconggong', 'Bariis', 'Bical', 'Bon-ot',
  'Bulawan', 'Cadandanan', 'Calomagon', 'Cabigaan', 'Calpi', 'Central',
  'Cocaon', 'Culasi', 'Dancalan', 'Danlog', 'Fabrica', 'Gabao', 'Gate',
  'Guruyan', 'Hollywood', 'Sabang', 'Inda', 'Jibong', 'Juan Ziga',
  'Lagondong', 'Lajong', 'Lipata', 'Mabuhay', 'Macawayan', 'Mainit',
  'Managa-naga', 'Mangayawon', 'Manook', 'Marifosque', 'Matanglad',
  'Matnog', 'Nasuje', 'Oto-ot', 'Pantalan', 'Pinontingan', 'Poctol',
  'Rangas', 'Rizal', 'Sagrada', 'Salvacion', 'San Ramon', 'San Vicente',
  'Sapngan', 'Sawmill', 'Sogod', 'Somil', 'Tabon-tabon', 'Tinampo',
  'Tinaman', 'Tomalaytay', 'Torreta', 'Tugon', 'Zone I (Pob.)',
  'Zone II (Pob.)', 'Zone III (Pob.)', 'Zone IV (Pob.)',
]

export const barangays: Barangay[] = barangayNames.map((name, i) => ({
  id: `brgy-${String(i + 1).padStart(2, '0')}`,
  name,
}))

const firstNames = ['Juan', 'Pedro', 'Maria', 'Jose', 'Ana', 'Ramon', 'Luz', 'Ernesto', 'Corazon', 'Antonio', 'Rosa', 'Fernando']
const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Bautista', 'Villanueva', 'Fernandez', 'Aquino', 'Mendoza', 'Torres', 'Ramos']
function pseudoName(seed: number) {
  return `${firstNames[seed % firstNames.length]} ${lastNames[(seed * 3) % lastNames.length]}`
}

export const officials: Official[] = barangays.flatMap((b, i) => {
  const roles: Official['position'][] = ['Punong Barangay', 'Treasurer', 'Secretary', 'Kagawad', 'Kagawad']
  return roles.map((position, j) => ({
    id: `${b.id}-off-${j}`,
    barangayId: b.id,
    position,
    name: pseudoName(i * 7 + j),
  }))
})

export const clients: Client[] = [
  {
    id: 'client-1',
    name: 'Camille Masongsong',
    loginId: 'cmasongsong',
    password: 'bulan2026',
    active: true,
    barangayIds: [barangays[0].id, barangays[1].id, barangays[2].id, barangays[60].id],
  },
  {
    id: 'client-2',
    name: 'Ronel Marasigan',
    loginId: 'rmarasigan',
    password: 'bulan2026',
    active: true,
    barangayIds: [barangays[10].id, barangays[11].id],
  },
  {
    id: 'client-3',
    name: 'Grace Panganiban',
    loginId: 'gpanganiban',
    password: 'bulan2026',
    active: false,
    barangayIds: [barangays[20].id],
  },
]

// --- Forms ---
export const forms: ProcurementForm[] = [
  {
    id: 'form-pr',
    name: 'Purchase Request (PR)',
    description: 'Standard barangay Purchase Request form with itemized table and signatories.',
    category: 'Procurement',
    currentVersion: 2,
    published: true,
    updatedAt: '2026-08-14',
    versions: [
      {
        version: 1,
        createdAt: '2026-05-02',
        changeNote: 'Initial version',
        page: { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } },
        elements: [],
      },
      {
        version: 2,
        createdAt: '2026-08-14',
        changeNote: 'Added fund source field and revised signature block',
        page: { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } },
        elements: [
          { id: 'el-1', type: 'static_text', label: 'Republic of the Philippines', source: 'input', x: 0, y: 0, w: 12, h: 1, page: 1 },
          { id: 'el-2', type: 'static_text', label: 'Municipality of Bulan, Province of Sorsogon', source: 'input', x: 0, y: 1, w: 12, h: 1, page: 1 },
          { id: 'el-3', type: 'section_heading', label: 'PURCHASE REQUEST', source: 'input', x: 0, y: 3, w: 12, h: 1, page: 1,
            paragraphStyle: { align: 'center', indent: 0, listType: 'none', hyphenate: false, lineHeight: 1.4 } },
          { id: 'el-4', type: 'short_text', label: 'Barangay', source: 'database', databaseField: 'barangay_name', x: 0, y: 5, w: 6, h: 1, page: 1 },
          { id: 'el-5', type: 'short_text', label: 'PR No.', source: 'input', x: 6, y: 5, w: 3, h: 1, page: 1 },
          { id: 'el-6', type: 'date', label: 'Date', source: 'input', x: 9, y: 5, w: 3, h: 1, page: 1 },
          { id: 'el-7', type: 'dropdown', label: 'Fund Source', source: 'input', x: 0, y: 6, w: 6, h: 1, page: 1, options: ['General Fund', '20% Development Fund', 'SK Fund', 'Calamity Fund'] },
          { id: 'el-8', type: 'short_text', label: 'Purpose', source: 'input', x: 0, y: 7, w: 12, h: 1, page: 1 },
          {
            id: 'el-9', type: 'table', label: 'Items', source: 'input', x: 0, y: 9, w: 12, h: 6, page: 1,
            columns: [
              { id: 'qty', label: 'Qty', width: 1, type: 'number' },
              { id: 'unit', label: 'Unit', width: 1, type: 'short_text' },
              { id: 'desc', label: 'Item Description', width: 5, type: 'short_text' },
              { id: 'unit_price', label: 'Unit Price', width: 2, type: 'currency' },
              { id: 'total', label: 'Total', width: 2, type: 'calculated', formula: 'qty * unit_price', summarize: true },
            ],
          },
          { id: 'el-10', type: 'dynamic_text', label: 'Certification', source: 'dynamic_text', x: 0, y: 16, w: 12, h: 2, page: 1,
            tokens: [
              { type: 'text', value: 'I hereby certify that the above items are necessary for the operations of Barangay ' },
              { type: 'field', fieldId: 'barangay_name' },
              { type: 'text', value: '.' },
            ] },
          { id: 'el-11', type: 'signature', label: 'Requested by', source: 'input', x: 0, y: 19, w: 6, h: 2, page: 1, border: { preset: 'top_bottom', thickness: 1, color: '#1C1B17', radius: 0 } },
          { id: 'el-12', type: 'signature', label: 'Approved by (Punong Barangay)', source: 'database', databaseField: 'punong_barangay', x: 6, y: 19, w: 6, h: 2, page: 1, border: { preset: 'top_bottom', thickness: 1, color: '#1C1B17', radius: 0 } },
        ],
      },
    ],
  },
  {
    id: 'form-canvass',
    name: 'Request for Quotation (RFQ)',
    description: 'Canvass sheet sent to suppliers, with comparative pricing table.',
    category: 'Procurement',
    currentVersion: 1,
    published: true,
    updatedAt: '2026-07-30',
    versions: [
      {
        version: 1,
        createdAt: '2026-07-30',
        page: { size: 'Letter', orientation: 'landscape', margins: { top: 18, right: 18, bottom: 18, left: 18 } },
        elements: [
          { id: 'el-1', type: 'section_heading', label: 'REQUEST FOR QUOTATION', source: 'input', x: 0, y: 0, w: 12, h: 1, page: 1,
            paragraphStyle: { align: 'center', indent: 0, listType: 'none', hyphenate: false, lineHeight: 1.4 } },
          { id: 'el-2', type: 'short_text', label: 'Supplier', source: 'input', x: 0, y: 2, w: 6, h: 1, page: 1 },
          { id: 'el-3', type: 'date', label: 'Date', source: 'input', x: 6, y: 2, w: 3, h: 1, page: 1 },
          { id: 'el-4', type: 'table', label: 'Items', source: 'input', x: 0, y: 4, w: 12, h: 6, page: 1,
            columns: [
              { id: 'desc', label: 'Description', width: 6, type: 'short_text' },
              { id: 'qty', label: 'Qty', width: 1, type: 'number' },
              { id: 'unit', label: 'Unit', width: 1, type: 'short_text' },
              { id: 'price', label: 'Unit Price', width: 2, type: 'currency' },
              { id: 'total', label: 'Total', width: 2, type: 'calculated', formula: 'qty * price', summarize: true },
            ] },
        ],
      },
    ],
  },
  {
    id: 'form-iar',
    name: 'Inspection & Acceptance Report',
    description: 'Confirms delivered goods match the PO/PR before payment is released.',
    category: 'Procurement',
    currentVersion: 1,
    published: false,
    updatedAt: '2026-08-01',
    versions: [
      {
        version: 1,
        createdAt: '2026-08-01',
        page: { size: 'Letter', orientation: 'portrait', margins: { top: 20, right: 18, bottom: 20, left: 18 } },
        elements: [
          { id: 'el-1', type: 'section_heading', label: 'INSPECTION AND ACCEPTANCE REPORT', source: 'input', x: 0, y: 0, w: 12, h: 1, page: 1,
            paragraphStyle: { align: 'center', indent: 0, listType: 'none', hyphenate: false, lineHeight: 1.4 } },
        ],
      },
    ],
  },
]

function officialSnapshotFor(barangayId: string) {
  const list = officials.filter(o => o.barangayId === barangayId)
  const snap: Record<string, string> = {}
  for (const o of list) {
    if (!snap[o.position]) snap[o.position] = o.name
  }
  return snap
}

export const submissions: Submission[] = [
  {
    id: 'sub-1001',
    formId: 'form-pr',
    formVersion: 2,
    barangayId: barangays[0].id,
    clientId: 'client-1',
    status: 'submitted',
    data: { pr_no: 'PR-2026-014', purpose: 'Office supplies for Q3', fund_source: 'General Fund' },
    officialSnapshot: officialSnapshotFor(barangays[0].id),
    createdAt: '2026-08-20T09:12:00+08:00',
    updatedAt: '2026-08-20T09:40:00+08:00',
    submittedAt: '2026-08-20T09:40:00+08:00',
  },
  {
    id: 'sub-1002',
    formId: 'form-pr',
    formVersion: 2,
    barangayId: barangays[1].id,
    clientId: 'client-1',
    status: 'draft',
    data: { pr_no: 'PR-2026-015', purpose: 'Repair of multipurpose hall roof' },
    officialSnapshot: officialSnapshotFor(barangays[1].id),
    createdAt: '2026-08-28T14:02:00+08:00',
    updatedAt: '2026-08-29T08:15:00+08:00',
  },
  {
    id: 'sub-1003',
    formId: 'form-canvass',
    formVersion: 1,
    barangayId: barangays[60].id,
    clientId: 'client-1',
    status: 'submitted',
    data: { supplier: 'Bulan Hardware & Trading' },
    officialSnapshot: officialSnapshotFor(barangays[60].id),
    createdAt: '2026-08-15T10:00:00+08:00',
    updatedAt: '2026-08-15T11:20:00+08:00',
    submittedAt: '2026-08-15T11:20:00+08:00',
  },
  {
    id: 'sub-1004',
    formId: 'form-pr',
    formVersion: 2,
    barangayId: barangays[11].id,
    clientId: 'client-2',
    status: 'submitted',
    data: { pr_no: 'PR-2026-011', purpose: 'Purchase of medical supplies' },
    officialSnapshot: officialSnapshotFor(barangays[11].id),
    createdAt: '2026-08-10T09:00:00+08:00',
    updatedAt: '2026-08-10T10:10:00+08:00',
    submittedAt: '2026-08-10T10:10:00+08:00',
  },
]

export function barangayName(id: string) {
  return barangays.find(b => b.id === id)?.name ?? id
}
export function clientName(id: string) {
  return clients.find(c => c.id === id)?.name ?? id
}
export function formName(id: string) {
  return forms.find(f => f.id === id)?.name ?? id
}
