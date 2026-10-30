import type { BorderPreset } from './types'

/** Shared border classes for builder canvas and document renderer. */
export function borderClass(preset?: BorderPreset): string {
  switch (preset) {
    case 'outside':
    case 'all':
    case 'section_box':
    case 'table_grid':
      return 'border border-ink/70'
    case 'inside':
      return 'border border-ink/40'
    case 'top_bottom':
      return 'border-t border-b border-ink/70'
    case 'bottom_only':
      return 'border-b border-ink/70'
    default:
      return ''
  }
}
