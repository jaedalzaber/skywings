import type { ReactNode } from 'react'

type Theme = 'brand' | 'dark' | 'light' | null | undefined

/**
 * Common outer wrapper for every industry section: theme class, optional
 * anchor target, and the shared gutter container.
 *
 * Centralising it keeps page rhythm consistent — a new block cannot
 * accidentally invent its own padding or max width.
 */
export function SectionShell(props: {
  anchorId?: null | string
  bleed?: boolean
  children: ReactNode
  className?: string
  labelledBy?: string
  theme?: Theme
}) {
  const { anchorId, bleed, children, className, labelledBy, theme } = props

  const resolvedTheme = theme ?? 'light'

  return (
    <section
      aria-labelledby={labelledBy}
      className={['industry-section', `is-${resolvedTheme}`, className].filter(Boolean).join(' ')}
      // Light sections tell the sticky header to switch to its solid surface.
      data-nav-surface={resolvedTheme === 'light' ? 'white' : undefined}
      id={anchorId || undefined}
    >
      {bleed ? children : <div className="industry-container">{children}</div>}
    </section>
  )
}

/**
 * Renders a textarea value as separate lines. Editors write multi-line display
 * headings in the CMS; collapsing them to one line would lose the intended
 * typographic rhythm.
 */
export function MultilineHeading(props: {
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  id?: string
  value: string
}) {
  const { as: Tag = 'h2', className, id, value } = props
  const lines = value.split('\n').filter((line) => line.trim().length > 0)

  return (
    <Tag className={className} id={id}>
      {lines.map((line, index) => (
        <span className="industry-heading-line" key={`${line}-${index}`}>
          {line}
        </span>
      ))}
    </Tag>
  )
}

type Segment = {
  breakAfter?: boolean | null
  emphasis?: 'bold' | 'normal' | null
  id?: null | string
  text: string
}

/**
 * Heading assembled from emphasised segments, e.g. "High-Quality **GSE** Sales".
 * Segments flow inline so the emphasis lands mid-sentence rather than on whole
 * lines.
 */
export function SegmentedHeading(props: {
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  id?: string
  segments: Segment[]
}) {
  const { as: Tag = 'h2', className, id, segments } = props

  return (
    <Tag className={className} id={id}>
      {segments.map((segment, index) => (
        <span key={segment.id ?? `${segment.text}-${index}`}>
          {segment.emphasis === 'bold' ? <strong>{segment.text}</strong> : segment.text}
          {segment.breakAfter ? <br /> : ' '}
        </span>
      ))}
    </Tag>
  )
}
