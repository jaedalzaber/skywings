/*
 * A deliberately small Markdown dialect for writing articles in the repo,
 * turned into the Lexical JSON Payload stores -- so the seed can write
 * articles an editor can then open and change in the admin like any other.
 *
 * Blocks, separated by a blank line:
 *   ## Section            ### Sub-section
 *   - bullet              1. numbered
 *   > quotation
 *   ![alt](media:123)     an image from the media library, by id
 *   anything else         a paragraph
 * Inline: **bold**, *italic*, [text](href).
 *
 * Pure: media ids are resolved before this runs.
 */

type TextNode = {
  detail: 0
  format: number
  mode: 'normal'
  style: ''
  text: string
  type: 'text'
  version: 1
}

type LinkNode = {
  children: TextNode[]
  direction: 'ltr'
  fields: { linkType: 'custom'; newTab: boolean; url: string }
  format: ''
  indent: 0
  type: 'link'
  version: 3
}

type InlineNode = LinkNode | TextNode

type ElementBase = { direction: 'ltr'; format: ''; indent: 0; version: 1 }

export type LexicalBlock =
  | (ElementBase & { children: InlineNode[]; textFormat: 0; textStyle: ''; type: 'paragraph' })
  | (ElementBase & { children: InlineNode[]; tag: 'h2' | 'h3'; type: 'heading' })
  | (ElementBase & { children: InlineNode[]; type: 'quote' })
  | (ElementBase & {
      children: (ElementBase & { children: InlineNode[]; type: 'listitem'; value: number })[]
      listType: 'bullet' | 'number'
      start: 1
      tag: 'ol' | 'ul'
      type: 'list'
    })
  | { fields: null; format: ''; relationTo: 'media'; type: 'upload'; value: number; version: 3 }

export type LexicalDocument = {
  root: {
    children: LexicalBlock[]
    direction: 'ltr'
    format: ''
    indent: 0
    type: 'root'
    version: 1
  }
}

const BOLD = 1
const ITALIC = 1 << 1

const element: ElementBase = { direction: 'ltr', format: '', indent: 0, version: 1 }

function text(value: string, format = 0): TextNode {
  return { detail: 0, format, mode: 'normal', style: '', text: value, type: 'text', version: 1 }
}

/** Splits one line into text runs, links and bold/italic marks. */
export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = []
  // Links first, then bold before italic so "**" is never read as two "*".
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) nodes.push(text(source.slice(last, index)))

    if (match[1] !== undefined) {
      const url = match[2]
      nodes.push({
        children: [text(match[1])],
        direction: 'ltr',
        fields: { linkType: 'custom', newTab: /^https?:/.test(url), url },
        format: '',
        indent: 0,
        type: 'link',
        version: 3,
      })
    } else if (match[3] !== undefined) {
      nodes.push(text(match[3], BOLD))
    } else if (match[4] !== undefined) {
      nodes.push(text(match[4], ITALIC))
    }

    last = index + match[0].length
  }

  if (last < source.length) nodes.push(text(source.slice(last)))
  return nodes
}

function list(lines: string[], listType: 'bullet' | 'number'): LexicalBlock {
  return {
    ...element,
    children: lines.map((line, index) => ({
      ...element,
      children: parseInline(line.replace(/^(-|\d+\.)\s+/, '')),
      type: 'listitem' as const,
      value: index + 1,
    })),
    listType,
    start: 1,
    tag: listType === 'number' ? 'ol' : 'ul',
    type: 'list',
  }
}

export function markdownToLexical(source: string): LexicalDocument {
  const blocks = source
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const children = blocks.map((block): LexicalBlock => {
    const lines = block.split('\n').map((line) => line.trim())
    const joined = lines.join(' ')

    const image = /^!\[[^\]]*\]\(media:(\d+)\)$/.exec(joined)
    if (image) {
      return {
        fields: null,
        format: '',
        relationTo: 'media',
        type: 'upload',
        value: Number(image[1]),
        version: 3,
      }
    }
    if (joined.startsWith('### ')) {
      return { ...element, children: parseInline(joined.slice(4)), tag: 'h3', type: 'heading' }
    }
    if (joined.startsWith('## ')) {
      return { ...element, children: parseInline(joined.slice(3)), tag: 'h2', type: 'heading' }
    }
    if (lines.every((line) => line.startsWith('- '))) return list(lines, 'bullet')
    if (lines.every((line) => /^\d+\.\s/.test(line))) return list(lines, 'number')
    if (lines.every((line) => line.startsWith('>'))) {
      const quote = lines.map((line) => line.replace(/^>\s?/, '')).join(' ')
      return { ...element, children: parseInline(quote), type: 'quote' }
    }

    return {
      ...element,
      children: parseInline(joined),
      textFormat: 0,
      textStyle: '',
      type: 'paragraph',
    }
  })

  return {
    root: { children, direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 },
  }
}
