import type { CSSProperties } from 'react'
import type { ParagraphStyle, TextStyle } from './types'
import { paragraphStyleToCss } from './paragraphStyle'

// A small curated collection rather than every system font — these are the
// faces that actually make sense on an official government form: the two
// already loaded for the app chrome/document canvas, plus the handful of
// standard faces reviewers expect to see on a printed government form.
export const FONT_FAMILIES: { value: string; label: string; css: string }[] = [
  { value: 'source-serif', label: 'Source Serif (Document Serif)', css: '"Source Serif 4", Georgia, serif' },
  { value: 'plex-sans', label: 'IBM Plex Sans (UI Sans)', css: '"IBM Plex Sans", system-ui, sans-serif' },
  { value: 'plex-mono', label: 'IBM Plex Mono (Monospace)', css: '"IBM Plex Mono", monospace' },
  { value: 'times', label: 'Times New Roman', css: '"Times New Roman", Times, serif' },
  { value: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { value: 'georgia', label: 'Georgia', css: 'Georgia, serif' },
  { value: 'courier', label: 'Courier New', css: '"Courier New", Courier, monospace' },
]

// Only used to seed the Inspector's controls before the person has picked
// anything. Deliberately NOT applied automatically to elements/columns that
// have no textStyle set — see textStyleToCss below.
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'source-serif',
  fontSize: 13,
}

export function fontCssFor(fontFamily: string): string {
  return FONT_FAMILIES.find(f => f.value === fontFamily)?.css ?? FONT_FAMILIES[0].css
}

/**
 * A single source of truth for turning a TextStyle into inline CSS — same
 * pattern as paragraphStyleToCss, so the builder canvas and the print
 * renderer can't drift apart on typography either.
 *
 * Unlike paragraphStyleToCss, an unset style returns an EMPTY object rather
 * than a default: existing elements/columns already have a correct size
 * baked into their Tailwind classes (e.g. table cells at 11.5px, headings
 * at 15px), and we don't want every un-customized element to silently jump
 * to one global font size. Once a person actually picks a font/size in the
 * Inspector, that explicit choice takes over from the class default.
 */
export function textStyleToCss(style: TextStyle | undefined): CSSProperties {
  if (!style) return {}
  // Once a style object exists (the person has opened the Font panel and
  // touched something), every property is stated explicitly — including the
  // "off" states — rather than only adding "on" styling. Otherwise a
  // hardcoded default class elsewhere (e.g. a element type that's italic by
  // default) would keep winning even after the person turns the toggle off,
  // since nothing would ever tell the browser to go back to normal.
  return {
    fontFamily: fontCssFor(style.fontFamily),
    fontSize: style.fontSize,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? 'italic' : 'normal',
    textDecorationLine: [style.underline && 'underline', style.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
  }
}

/**
 * Combines paragraph + font CSS for one element/column in a single call, so
 * every render site (builder canvas, print renderer, fill-form inputs)
 * applies both the same way instead of re-spreading two objects everywhere.
 */
export function textAndParagraphCss(
  paragraphStyle: ParagraphStyle | undefined,
  textStyle: TextStyle | undefined
): CSSProperties {
  return { ...paragraphStyleToCss(paragraphStyle), ...textStyleToCss(textStyle) }
}
