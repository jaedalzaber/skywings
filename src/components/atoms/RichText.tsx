import { Fragment, type ReactNode } from 'react'

/**
 * Minimal, dependency-free renderer for Payload's Lexical rich-text value.
 * Handles the node types the product description actually uses (paragraphs,
 * headings, lists, links, line breaks, and text formatting marks). Anything it
 * doesn't recognise is skipped rather than crashing.
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
  fields?: { url?: string | null; newTab?: boolean | null }
  url?: string | null
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

function renderChildren(children?: LexicalNode[]): ReactNode {
  if (!children?.length) {
    return null
  }

  return children.map((child, index) => renderNode(child, index))
}

function renderNode(node: LexicalNode, key: number): ReactNode {
  switch (node.type) {
    case 'text':
      return renderText(node, key)
    case 'linebreak':
      return <br key={key} />
    case 'paragraph':
      return <p key={key}>{renderChildren(node.children)}</p>
    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag ?? '')
        ? node.tag
        : 'h3') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Tag key={key}>{renderChildren(node.children)}</Tag>
    }
    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return <Tag key={key}>{renderChildren(node.children)}</Tag>
    }
    case 'listitem':
      return <li key={key}>{renderChildren(node.children)}</li>
    case 'quote':
      return <blockquote key={key}>{renderChildren(node.children)}</blockquote>
    case 'link':
    case 'autolink': {
      const href = node.fields?.url ?? node.url ?? '#'
      const newTab = node.fields?.newTab
      return (
        <a href={href} key={key} {...(newTab ? { rel: 'noreferrer', target: '_blank' } : {})}>
          {renderChildren(node.children)}
        </a>
      )
    }
    default:
      // Unknown block: render its children if any, otherwise skip.
      return node.children ? <Fragment key={key}>{renderChildren(node.children)}</Fragment> : null
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

export function RichText(props: { className?: string; value: LexicalValue }) {
  const { className, value } = props

  if (richTextIsEmpty(value)) {
    return null
  }

  return <div className={className}>{renderChildren(value?.root?.children)}</div>
}
