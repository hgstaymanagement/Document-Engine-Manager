// Every table ID and field ID for the "claude.form-builder.database" base,
// in one place. Every other Airtable-facing file (client, mappers, store)
// reads from here instead of hard-coding ids — same pattern as
// src/lib/pageGeometry.ts and src/lib/paragraphStyle.ts being the one
// shared source for the builder/print renderer.

export const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appualgH3NCJzKMz3'

export const TABLES = {
  barangays: 'tblsqJDGzXwzRkcPf',
  officials: 'tblb5CjugjeZvNv5I',
  clients: 'tblRgFiUN48xCMqDg',
  forms: 'tblCrfFF9EoZausyt',
  formVersions: 'tblFm6LWzBSkwObxY',
  submissions: 'tblEe26zp4P8I1eqw',
} as const

export const FIELDS = {
  barangays: {
    name: 'fld1Bp6ZURD8gXBVT',
  },
  officials: {
    name: 'fldoekX8ho7exr9om',
    position: 'fldoUIau533eWP0Fy',
    barangay: 'fldvCrpMprbND2nt6',
  },
  clients: {
    name: 'fldtag7b1NkJRCwUo',
    loginId: 'fldyAS04tvzQIYir2',
    password: 'fldRnHoRGCFX5F13y',
    active: 'fld2Iy4i4YQkGOfOX',
    assignedBarangays: 'fldwhIppCWA14ryNg',
  },
  forms: {
    name: 'fldi5oTHtKGEDF0dL',
    description: 'fldhm7bBJM2aVyfMo',
    category: 'fldsWYzz2ULfVrDOd',
    published: 'fldgbC9EkF3KC7fCv',
    currentVersion: 'fldqolaHUwuaa8eod',
    updatedAt: 'fldkwicCQ8F5isJ5U',
  },
  formVersions: {
    name: 'fldxmcxteUqHZ40k5',
    form: 'fldUDv9LJRwtB8GIk',
    version: 'fldDiPVTZuZdrKOuT',
    createdAt: 'fldA2VL1iiSy0PNwk',
    changeNote: 'fldvHDM3Vrqpik7of',
    pageSize: 'fld096Mgcgya5yQrH',
    orientation: 'fldo7wRrrhUXRd9vR',
    marginsJson: 'fldqwkK0DJc4D49BL',
    elementsJson: 'fldZicBCrubUoJmWw',
  },
  submissions: {
    name: 'fldDTqZXADXiASzyU',
    form: 'fldP4XyCbs4zln9Wz',
    formVersion: 'fldn1DcggvQk4863f',
    barangay: 'fldwqCZTG9Zb7vbOW',
    client: 'fldjusywx0MO9ozyD',
    status: 'fldIgVh60opQLnMM8',
    dataJson: 'fldb5DfWZprCrU7se',
    officialSnapshotJson: 'fldJORrPIJQccbEvs',
    createdAt: 'fldvqkSJ7FbvQZeRz',
    updatedAt: 'fld70WAEEeZngwBoB',
    submittedAt: 'fld4Nza9Oy7UqhrvD',
  },
} as const
