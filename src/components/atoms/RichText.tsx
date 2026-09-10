import { Fragment, type ReactNode } from 'react'

import { SafeImg } from './SafeImage'

/**
 * Minimal, dependency-free renderer for Payload's Lexical rich-text value.
 * Handles the node types the product description and the articles use
 * (paragraphs, headings, lists, quotes, links, line breaks, text formatting
 * marks and uploaded images). Anything it doesn't recognise is skipped rather
 * than crashing.
 */

type LexicalNode = {
  type?: string
  version?: number
  children?: LexicalNode[]
  // text node
  text?: string
  format?: number | string
  // element node
  tag?: string
  listType?: string
  // link node
  fields?: { url?: string | null; newTab?: boolean | null } | null
  url?: string | null
  // upload node: the media document once populated, its id before
  relationTo?: string
  value?: unknown
}

/**
 * Per-render state. Headings are numbered in document order so each can be
 * given the id its table-of-contents entry points at.
 */
type RenderContext = {
  headingIds?: readonly string[]
  headingIndex: number
}

type LexicalValue = { root?: { children?: LexicalNode[] } } | null | undefined

const IS_BOLD = 1
const IS_ITALIC = 1 << 1
const IS_STRIKETHROUGH = 1 << 2
const IS_UNDERLINE = 1 << 3
const IS_CODE = 1 << 4

function renderText(node: LexicalNode, key: number): ReactNode {
  const text = node.text ?? ''
  if (!text) {
    return null
  }

  const format = typeof node.format === 'number' ? node.format : 0
  let content: ReactNode = text

  if (format & IS_CODE) content = <code>{content}</code>
  if (format & IS_BOLD) content = <strong>{content}</strong>
  if (format & IS_ITALIC) content = <em>{content}</em>
  if (format & IS_UNDERLINE) content = <u>{content}</u>
  if (format & IS_STRIKETHROUGH) content = <s>{content}</s>

  return <Fragment key={key}>{content}</Fragment>
}

function renderChildren(children: LexicalNode[] | undefined, context: RenderContext): ReactNode {
  if (!children?.length) {
    return null
  }

  return children.map((child, index) => renderNode(child, index, context))
}

/** An image placed in the content, once Payload has populated its file. */
function renderUpload(node: LexicalNode, key: number): ReactNode {
  const media = node.value as { alt?: unknown; mimeType?: unknown; url?: unknown } | null
  if (!media || typeof media !== 'object' || typeof media.url !== 'string') return null
  if (typeof media.mimeType === 'string' && !media.mimeType.startsWith('image/')) return null

  return (
    <figure className="rich-text-figure" key={key}>
      <SafeImg
        alt={typeof media.alt === 'string' ? media.alt : ''}
        loading="lazy"
        src={media.url}
      />
    </figure>
  )
}

function renderNode(node: LexicalNode, key: number, context: RenderContext): ReactNode {
  const renderChildrenOf = (children?: LexicalNode[]) => renderChildren(children, context)

  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'paragraph':
      return <p key={key}>{renderChildrenOf(node.children)}</p>
    case 'heading': {
      const Tag = (
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag ?? '') ? node.tag : 'h3'
      ) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const id = context.headingIds?.[context.headingIndex]
      context.headingIndex += 1
      return (
        <Tag id={id} key={key}>
          {renderChildrenOf(node.children)}
        </Tag>
      )
    }
    case 'upload':
      return renderUpload(node, key)
    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={key}>{renderChildrenOf(node.children)}</Tag>
    }
    case 'listitem':
      return <li key={key}>{renderChildrenOf(node.children)}</li>
    case 'quote':
      return <blockquote key={key}>{renderChildrenOf(node.children)}</blockquote>
    case 'link':
    case 'autolink': {
      const href = node.fields?.url ?? node.url ?? '#'
      const newTab = node.fields?.newTab
      return (
        <a href={href} key={key} {...(newTab ? { rel: 'noreferrer', target: '_blank' } : {})}>
          {renderChildrenOf(node.children)}
        </a>
      )
    }
    default:
      // Unknown block: render its children if any, otherwise skip.
      return node.children ? <Fragment key={key}>{renderChildrenOf(node.children)}</Fragment> : null
  }
}

export function richTextIsEmpty(value: LexicalValue): boolean {
  const children = value?.root?.children
  if (!children?.length) {
    return true
  }

  const text = JSON.stringify(children)
  // Any text content or media/link node means it's not empty.
  return !/"text":"[^"]/.test(text) && !/"type":"(link|autolink|upload|list)"/.test(text)
}

export function RichText(props: {
  className?: string
  /**
   * Ids for the headings, in document order -- from headingIds() in
   * lib/articles/outline, which the table of contents is built from too.
   */
  headingIds?: readonly string[]
  value: LexicalValue
}) {
  const { className, headingIds, value } = props

  if (richTextIsEmpty(value)) {
    return null
  }

  return (
    <div className={className}>
      {renderChildren(value?.root?.children, { headingIds, headingIndex: 0 })}
    </div>
  )
}
