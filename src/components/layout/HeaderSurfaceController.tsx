'use client'

import { useEffect } from 'react'

/**
 * Sections declare the header treatment they need with `data-nav-surface`,
 * and whichever one the bar is currently over wins. The value is mirrored onto
 * <html data-nav-surface="...">, so the theming is pure CSS from there and a
 * new section only has to add the attribute:
 *
 *   <section data-nav-surface="dark">   // light type on a dark bar
 *   <section data-nav-surface="white">  // solid white bar, no blur
 *
 * Any other value works too, as long as the stylesheet defines a matching
 * `html[data-nav-surface='...']` block.
 */
const surfaceSelector = '[data-nav-surface]'

/*
 * The bar sits at the document's top edge, so `position: sticky` is engaged
 * from the first pixel and there is no geometry that distinguishes "resting"
 * from "pinned" -- its rect reads top: 0 either way. Scroll offset is the only
 * honest signal. A few pixels of deadband keeps a rubber-banding trackpad from
 * flipping the state back and forth at the very top of the page.
 */
const stuckThreshold = 8

export function HeaderSurfaceController() {
  useEffect(() => {
    const root = document.documentElement
    const header = document.querySelector<HTMLElement>('.nav-container')

    if (!header) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>(surfaceSelector))
    let frame = 0

    /*
     * Only ever writes a value that differs from the one already there.
     * Re-assigning an identical attribute still produces a mutation record,
     * and smooth scrolling keeps this running long after the page has come to
     * rest -- which had the scroll scenes re-measuring dozens of times a
     * second off the back of an attribute that never actually changed, and
     * cancelled any CSS transition running inside a pinned section.
     */
    const write = (key: 'navStuck' | 'navSurface', value: string | null) => {
      if (value === null) {
        if (root.dataset[key] !== undefined) delete root.dataset[key]
      } else if (root.dataset[key] !== value) {
        root.dataset[key] = value
      }
    }

    const update = () => {
      frame = 0

      write('navStuck', window.scrollY > stuckThreshold ? 'true' : null)

      if (sections.length === 0) return

      /*
       * Probed at the bar's own midline rather than its top edge, so the
       * hand-off happens when the bar is visually over the new section rather
       * than the moment its first pixel touches it.
       */
      const bounds = header.getBoundingClientRect()
      const probe = bounds.top + bounds.height / 2
      // Last match wins: sections that overlap resolve to the one painted on
      // top, which is the one the bar is actually sitting over.
      const active = sections.reduce<string | null>((current, section) => {
        const rect = section.getBoundingClientRect()
        const surface = section.dataset.navSurface

        return surface && rect.top <= probe && rect.bottom >= probe ? surface : current
      }, null)

      write('navSurface', active)
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate)
      if (frame) window.cancelAnimationFrame(frame)
      delete root.dataset.navSurface
      delete root.dataset.navStuck
    }
  }, [])

  return null
}
