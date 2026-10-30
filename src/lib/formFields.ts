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
      e.type !== 'section_heading'
  )
}
