import type { FormElement } from './types'

/**
 * Elements whose values actually get collected into a submission's flat
 * data object (keyed by element id) — i.e. exactly what a Dynamic Text
 * {{element_id}} placeholder can resolve to, and what the fill-form
 * sidebar renders an input for. Kept in one place so the two can't drift:
 * a field that's fillable but not offered in the Dynamic Text reference
 * (or vice versa) would be a confusing, hard-to-spot inconsistency.
 *
 * Scoped to page 1 for now — the fill-form screen only ever collects
 * values from page 1 today, so listing fields from other pages here would
 * offer placeholders that silently resolve to nothing.
 */
export function getFillableInputElements(elements: FormElement[]): FormElement[] {
  return elements.filter(
    e =>
      e.page === 1 &&
      (e.source === 'input' || e.type === 'checkbox') &&
      e.type !== 'table' &&
      e.type !== 'static_text' &&
      e.type !== 'section_heading' &&
      // Dynamic Text and Rich Text are compound paragraph elements, not
      // single-value inputs — Dynamic Text is read-only/computed, and Rich
      // Text's actual fillable content lives in its embedded blanks
      // (collected separately by getBlankFields), not the element itself.
      e.type !== 'dynamic_text' &&
      e.type !== 'rich_text'
  )
}

export interface BlankField {
  id: string
  label: string
}

/**
 * Fillable blanks embedded inside Rich Text elements' paragraphs (via the
 * "+ Add blank" button in the builder) — these aren't top-level elements,
 * they live nested inside an element's `tokens`, so they need their own
 * collection pass rather than showing up in getFillableInputElements.
 * Scoped to page 1 for the same reason as above.
 */
export function getBlankFields(elements: FormElement[]): BlankField[] {
  const blanks: BlankField[] = []
  for (const el of elements) {
    if (el.page !== 1 || !el.tokens) continue
    for (const t of el.tokens) {
      if (t.type === 'blank' && t.blankId) {
        blanks.push({ id: t.blankId, label: t.blankLabel || 'Blank' })
      }
    }
  }
  return blanks
}
