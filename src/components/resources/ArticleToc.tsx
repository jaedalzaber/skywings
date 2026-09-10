'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'

import type { OutlineEntry } from '@/lib/articles/outline'

type WindowWithLenis = Window & {
  __skywingsLenis?: { scrollTo: (target: HTMLElement, options?: { duration?: number }) => void }
}

/*
 * How far down the viewport a heading may sit and still be the one being
 * read. A jump lands a heading just under the header (its scroll-margin), so
 * the line sits a little lower than that or the section jumped to would not
 * light up.
 */
const READING_LINE = 0.25
const READING_LINE_MAX = 180

/**
 * Brings a section up under the header, through Lenis when it is running so
 * the jump eases like the rest of the page's scrolling -- the same way the
 * capabilities page jumps between processes.
 */
function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const heading = document.getElementById(id)
  if (!heading) return

  event.preventDefault()
  window.history.replaceState(null, '', `#${id}`)

  const lenis = (window as WindowWithLenis).__skywingsLenis
  if (lenis) {
    lenis.scrollTo(heading, { duration: 0.9 })
    return
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  heading.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/**
 * The article's sections, following the reader: the one on screen is marked,
 * and a long list keeps it in view inside its own scroll rather than moving
 * the page. `variant` sets the sidebar card or the compact list above the text
 * on narrow screens; both track the same headings.
 */
export function ArticleToc({
  entries,
  variant = 'sidebar',
}: {
  entries: OutlineEntry[]
  variant?: 'inline' | 'sidebar'
}) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null)
  const listRef = useRef<HTMLOListElement | null>(null)

  useEffect(() => {
    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((heading): heading is HTMLElement => Boolean(heading))
    if (!headings.length) return

    let frame = 0
    const measure = () => {
      frame = 0
      const line = Math.min(window.innerHeight * READING_LINE, READING_LINE_MAX)
      let current = headings[0].id
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top - line <= 0) current = heading.id
        else break
      }
      setActive((previous) => (previous === current ? previous : current))
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [entries])

  // Keep the marked entry visible when the list scrolls inside its card.
  useEffect(() => {
    const list = listRef.current
    const link = list?.querySelector<HTMLElement>('[aria-current="location"]')
    if (!list || !link || list.scrollHeight <= list.clientHeight) return

    const top = link.offsetTop - list.offsetTop
    if (top < list.scrollTop || top + link.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3) })
    }
  }, [active])

  if (!entries.length) return null

  return (
    <nav aria-label="Table of contents" className="post-toc" data-variant={variant}>
      <p className="post-toc-title">
        {variant === 'inline' ? 'On this page' : 'Table of contents'}
      </p>
      <ol className="post-toc-list" ref={listRef}>
        {entries.map((entry) => (
          <li data-level={entry.level} key={entry.id}>
            <a
              aria-current={active === entry.id ? 'location' : undefined}
              className="post-toc-link"
              href={`#${entry.id}`}
              onClick={(event) => jumpTo(event, entry.id)}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
