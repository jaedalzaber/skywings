'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'

/** `label` is the sub-navigation's short form; the head's list uses `title`. */
type Item = { label: string; slug: string; title: string }

type WindowWithLenis = Window & {
  __skywingsLenis?: { scrollTo: (target: HTMLElement, options?: { duration?: number }) => void }
}

/**
 * How far below the bars a section's top may sit and still count as the one
 * being read. A jump lands a section's top a little under the sub-navigation
 * (its scroll-margin), so the line has to sit lower than that or the section
 * just jumped to would not light up.
 */
const READING_LINE = 0.25
const READING_LINE_MAX = 160

/**
 * Brings a process up under the header. Goes through Lenis when it is
 * running, so the jump eases like the rest of the page's scrolling instead of
 * snapping out from under it; both honour the section's scroll-margin-top,
 * which clears the header and the sub-navigation. Shared by the head's list
 * and the sub-navigation, so the two jump the same way.
 */
function jumpToSection(event: MouseEvent<HTMLAnchorElement>, slug: string) {
  const section = document.getElementById(slug)
  if (!section) return

  event.preventDefault()
  window.history.replaceState(null, '', `#${slug}`)

  const lenis = (window as WindowWithLenis).__skywingsLenis
  if (lenis) {
    lenis.scrollTo(section, { duration: 0.9 })
    return
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  section.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/** The list of processes in the page head, beside the intro. */
export function CapabilitiesIndex({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Processes on this page" className="capabilities-index">
      <ul>
        {items.map((item) => (
          <li key={item.slug}>
            <a href={`#${item.slug}`} onClick={(event) => jumpToSection(event, item.slug)}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * The page's sub-navigation: one link per process, marking the process being
 * read.
 *
 * It is not there at the top of the page -- the head's own list does that job
 * -- and comes down from under the header only once the processes reach it,
 * going back up after the last one. Fixed rather than sticky for that reason:
 * a sticky bar keeps its place in the flow, and would leave an empty band
 * under the head until it pinned.
 *
 * The current section is worked out from scroll position on each frame rather
 * than with an IntersectionObserver, the same way the page's other scroll
 * controllers do it: a process can be several screens tall, and "which one is
 * under the reading line" is one comparison per section.
 */
export function CapabilitiesSubnav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? null)
  const [shown, setShown] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const nav = navRef.current
    const header = document.querySelector<HTMLElement>('.nav-container')
    const sections = items
      .map((item) => document.getElementById(item.slug))
      .filter((section): section is HTMLElement => Boolean(section))
    if (!nav || sections.length === 0) return

    let frame = 0

    const sync = () => {
      frame = 0
      /*
       * Measured from the header and this bar's own height, not from this bar's
       * rect: while it is hidden it is translated up out of view, and its rect
       * would move the line with it.
       */
      const bars = (header?.getBoundingClientRect().bottom ?? 0) + nav.offsetHeight
      const first = sections[0].getBoundingClientRect()
      const last = sections[sections.length - 1].getBoundingClientRect()
      setShown(first.top <= bars + 1 && last.bottom > bars)

      const line = bars + Math.min(window.innerHeight * READING_LINE, READING_LINE_MAX)
      /*
       * The last process may be too short to ever reach the line, so the
       * bottom of the page settles on it rather than stranding the mark on the
       * one before.
       */
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      const current = atBottom
        ? sections[sections.length - 1]
        : sections.reduce<HTMLElement>(
            (found, section) => (section.getBoundingClientRect().top <= line ? section : found),
            sections[0],
          )

      setActive((value) => (value === current.id ? value : current.id))
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [items])

  /*
   * On a phone the links overflow sideways; keep the marked one in view. Set on
   * the list's own scroll position -- scrollIntoView could also move the page,
   * which is the one thing this must never do mid-scroll.
   */
  useEffect(() => {
    const list = listRef.current
    const link = list?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!list || !link) return

    const left = link.offsetLeft - list.offsetLeft
    const right = left + link.offsetWidth
    if (left < list.scrollLeft) list.scrollLeft = left - 16
    else if (right > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = right - list.clientWidth + 16
    }
  }, [active])

  return (
    <nav
      aria-label="Processes"
      className="capabilities-subnav"
      data-shown={shown ? 'true' : 'false'}
      ref={navRef}
    >
      <ul className="capabilities-subnav-list" ref={listRef}>
        {items.map((item) => (
          <li key={item.slug}>
            <a
              aria-current={active === item.slug ? 'true' : undefined}
              className="capabilities-subnav-link"
              // The full name, for anyone who pauses on the shorthand.
              title={item.title}
              href={`#${item.slug}`}
              onClick={(event) => {
                setActive(item.slug)
                jumpToSection(event, item.slug)
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
