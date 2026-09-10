'use client'

import { useEffect, useRef } from 'react'

type WindowWithLenis = Window & {
  __skywingsLenis?: {
    scrollTo: (target: number, options?: { duration?: number; immediate?: boolean }) => void
  }
}

/* Short enough to stay a handle on a very long page. */
const minThumb = 40
const surfaceSelector = '[data-nav-surface]'

/**
 * The page's own scrollbar, drawn over the page instead of beside it.
 *
 * A classic scrollbar takes a gutter of its own, and a gutter can only be one
 * colour -- a light strip down the side of every dark section, or a dark one
 * down every light section. The native bar is hidden (styles.css) and this
 * floats a thumb on no track over the content's right edge, so the page runs
 * to the edge of the window and the section shows through.
 *
 * The thumb takes its tone from the section under it, read from the same
 * `data-nav-surface` marks the header uses: light on a dark section, dark on
 * a light one.
 *
 * Decorative to assistive technology -- the page scrolls by keyboard, wheel
 * and touch as before. It is a pointer affordance: drag the thumb, or press
 * the track to jump there.
 */
export function PageScrollbar() {
  const barRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    const thumb = thumbRef.current
    if (!bar || !thumb) return

    const root = document.documentElement
    let frame = 0
    let size = 0
    let travel = 0
    let scrollable = 0

    const write = (key: 'ready' | 'surface', value: string | null) => {
      if (value === null) {
        if (bar.dataset[key] !== undefined) delete bar.dataset[key]
      } else if (bar.dataset[key] !== value) {
        bar.dataset[key] = value
      }
    }

    const measure = () => {
      frame = 0

      const view = window.innerHeight
      const total = root.scrollHeight
      scrollable = total - view

      // Nothing to scroll, or scrolling locked under a drawer or the viewer.
      const locked =
        getComputedStyle(document.body).overflowY === 'hidden' ||
        getComputedStyle(root).overflowY === 'hidden'
      if (scrollable <= 1 || locked) {
        write('ready', null)
        return
      }

      const track = bar.clientHeight
      size = Math.max(minThumb, (track * view) / total)
      travel = track - size
      const offset = travel * Math.min(1, Math.max(0, window.scrollY / scrollable))

      thumb.style.height = `${size}px`
      thumb.style.transform = `translate3d(0, ${offset}px, 0)`
      write('ready', 'true')

      // The section behind the thumb's middle. Last match wins, as in the header.
      const probe = offset + size / 2
      const surface = Array.from(document.querySelectorAll<HTMLElement>(surfaceSelector)).reduce<
        string | null
      >((current, section) => {
        const rect = section.getBoundingClientRect()
        return rect.top <= probe && rect.bottom >= probe
          ? (section.dataset.navSurface ?? current)
          : current
      }, null)
      write('surface', surface === 'dark' ? 'dark' : null)
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }

    const scrollToY = (y: number, immediate: boolean) => {
      const top = Math.min(scrollable, Math.max(0, y))
      const lenis = (window as WindowWithLenis).__skywingsLenis
      if (lenis) lenis.scrollTo(top, immediate ? { immediate: true } : { duration: 0.6 })
      else window.scrollTo({ behavior: 'auto', top })
    }

    // Dragging the thumb moves the page by the same share of its length.
    let dragStart: { pointer: number; scroll: number } | null = null

    const onThumbDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      dragStart = { pointer: event.clientY, scroll: window.scrollY }
      thumb.setPointerCapture(event.pointerId)
      bar.dataset.dragging = 'true'
    }

    const onThumbMove = (event: PointerEvent) => {
      if (!dragStart || travel <= 0) return
      const moved = event.clientY - dragStart.pointer
      scrollToY(dragStart.scroll + (moved / travel) * scrollable, true)
    }

    const onThumbUp = (event: PointerEvent) => {
      if (!dragStart) return
      dragStart = null
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId)
      delete bar.dataset.dragging
    }

    // Pressing the track brings the thumb's middle to the press.
    const onTrackDown = (event: PointerEvent) => {
      if (event.button !== 0 || travel <= 0) return
      event.preventDefault()
      const at = event.clientY - bar.getBoundingClientRect().top - size / 2
      scrollToY((at / travel) * scrollable, false)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // The page grows and shrinks without a scroll: images, accordions, routes.
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resize?.observe(document.body)
    // A drawer or the 3D viewer locks scrolling through an inline style.
    const locks = new MutationObserver(schedule)
    locks.observe(document.body, { attributeFilter: ['style'] })
    locks.observe(root, { attributeFilter: ['style'] })

    thumb.addEventListener('pointerdown', onThumbDown)
    thumb.addEventListener('pointermove', onThumbMove)
    thumb.addEventListener('pointerup', onThumbUp)
    thumb.addEventListener('pointercancel', onThumbUp)
    bar.addEventListener('pointerdown', onTrackDown)

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      resize?.disconnect()
      locks.disconnect()
      thumb.removeEventListener('pointerdown', onThumbDown)
      thumb.removeEventListener('pointermove', onThumbMove)
      thumb.removeEventListener('pointerup', onThumbUp)
      thumb.removeEventListener('pointercancel', onThumbUp)
      bar.removeEventListener('pointerdown', onTrackDown)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div aria-hidden="true" className="page-scrollbar" ref={barRef}>
      <div className="page-scrollbar-thumb" ref={thumbRef} />
    </div>
  )
}
