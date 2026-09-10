/*
 * What an article page derives from its rich text: the table of contents and
 * the reading time. Pure -- it reads the stored Lexical value and nothing else
 * -- so the page, the table of contents and the tests all agree on the same
 * heading ids.
 */

type Node = {
  children?: Node[]
  tag?: string
  text?: string
  type?: string
}

type LexicalValue = { root?: { children?: Node[] } } | null | undefined

export type OutlineEntry = {
  id: string
  /** 2 for a section, 3 for a sub-section. */
  level: 2 | 3
  text: string
}

export function nodeText(node: Node): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map(nodeText).join('')
}

/** "What is sheet metal prototyping?" -> "what-is-sheet-metal-prototyping". */
export function headingSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'section'
  )
}

/**
 * One id per top-level heading, in document order, unique within the article:
 * a second "Tolerances" becomes "tolerances-2". The renderer walks the same
 * headings in the same order, so it gives each one the id listed here.
 */
export function headingIds(value: LexicalValue): string[] {
  const seen = new Map<string, number>()

  return (value?.root?.children ?? [])
    .filter((node) => node.type === 'heading')
    .map((node) => {
      const base = headingSlug(nodeText(node))
      const count = (seen.get(base) ?? 0) + 1
      seen.set(base, count)
      return count === 1 ? base : `${base}-${count}`
    })
}

/** The table of contents: sections and sub-sections, H2 and H3. */
export function articleOutline(value: LexicalValue): OutlineEntry[] {
  const ids = headingIds(value)
  const headings = (value?.root?.children ?? []).filter((node) => node.type === 'heading')

  return headings.flatMap((node, index) => {
    const level = node.tag === 'h2' ? 2 : node.tag === 'h3' ? 3 : null
    const text = nodeText(node).trim()
    return level && text ? [{ id: ids[index], level, text } as OutlineEntry] : []
  })
}

const WORDS_PER_MINUTE = 220

/** Whole minutes at an unhurried technical reading pace, never less than one. */
export function readingMinutes(value: LexicalValue): number {
  const words = (value?.root?.children ?? [])
    .map(nodeText)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
