import type { CSSProperties } from 'react'
import type { ParagraphStyle } from './types'

export const DEFAULT_PARAGRAPH_STYLE: ParagraphStyle = {
  align: 'left',
  indent: 0,
  listType: 'none',
  hyphenate: false,
  lineHeight: 1.4,
}

/**
 * A single source of truth for turning a ParagraphStyle into inline CSS.
 * Used by both the builder canvas (DocCanvas) and the print/PDF renderer
 * (DocumentRender) so paragraph formatting can never drift between what
 * you see while building and what actually prints.
 */
export function paragraphStyleToCss(style: ParagraphStyle | undefined): CSSProperties {
  const s = style ?? DEFAULT_PARAGRAPH_STYLE
  const css: CSSProperties = {
    textAlign: s.align,
    textIndent: s.indent,
    lineHeight: s.lineHeight,
  }
  if (s.hyphenate) {
    css.hyphens = 'auto'
    css.overflowWrap = 'break-word'
  }
  if (s.listType !== 'none') {
    // A single paragraph field doesn't have list siblings to number against,
    // so we render it as one list-style line rather than a real <ul>/<ol> —
    // this still gives a marker (bullet or "1.") without restructuring the
    // token-based content into list items.
    css.display = 'list-item'
    css.listStylePosition = 'inside'
    css.listStyleType = s.listType === 'bullet' ? 'disc' : 'decimal'
  }
  return css
}
