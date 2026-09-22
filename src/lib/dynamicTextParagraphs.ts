import type { DynamicTextToken } from './types'

/**
 * Splits a flat dynamic-text token stream into paragraphs, using a blank
 * line (2+ consecutive newlines) as the paragraph boundary.
 *
 * This exists because CSS `text-indent` only ever applies to the first line
 * of a block box — rendering the whole field into one <p> meant only the
 * very first paragraph could ever receive a first-line indent, no matter
 * how many blank-line-separated paragraphs were typed. Splitting into one
 * <p> per paragraph here gives every paragraph its own first line (and, for
 * bulleted/numbered dynamic text, its own list marker).
 *
 * Single newlines within a paragraph are left untouched — white-space:
 * pre-line (applied via paragraphStyleToCss) already renders those as
 * in-paragraph line breaks without starting a new indented block.
 */
export function splitTokensIntoParagraphs(tokens: DynamicTextToken[] | undefined): DynamicTextToken[][] {
  if (!tokens || tokens.length === 0) return [[]]
  const paragraphs: DynamicTextToken[][] = [[]]

  for (const t of tokens) {
    // Field references and blanks are inline, self-contained tokens — pass
    // them straight through into the current paragraph. Only plain text
    // tokens carry the raw \n characters that mark a paragraph boundary;
    // reading t.value on a blank token (which stores its data in blankId /
    // blankLabel, not value) would read undefined and silently vanish the
    // whole token, which is exactly what was happening before.
    if (t.type === 'field' || t.type === 'blank') {
      paragraphs[paragraphs.length - 1].push(t)
      continue
    }
    const parts = (t.value ?? '').split(/\n{2,}/)
    parts.forEach((part, i) => {
      if (i > 0) paragraphs.push([])
      if (part.length > 0) paragraphs[paragraphs.length - 1].push({ type: 'text', value: part })
    })
  }

  // Drop any paragraphs that ended up empty (e.g. trailing blank lines).
  const nonEmpty = paragraphs.filter(p => p.length > 0)
  return nonEmpty.length > 0 ? nonEmpty : [[]]
}
