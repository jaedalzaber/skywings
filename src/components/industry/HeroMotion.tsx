'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/**
 * GSAP choreography for the industry hero.
 *
 * Entrance: the picture settles from a soft zoom, the caption panel slides up
 * out of the bottom edge, headline words rise out of their masks, and the
 * statistics fade in while counting up to their values.
 *
 * Scroll: a scrubbed timeline parallaxes the picture, darkens it, and lifts
 * the caption away as the hero leaves the viewport, so the intro below feels
 * pulled into place rather than simply appearing.
 *
 * Everything is skipped under `prefers-reduced-motion`; the markup already
 * renders in its final state, so no JavaScript is needed to see the hero.
 */
export function HeroMotion(props: {
  children: ReactNode
  className: string
  id?: string
  overlayAlign: string
}) {
  const rootRef = useRef<HTMLElement>(null)

  // The hero tucks under the sticky header by exactly the header's height.
  // That height depends on breakpoint, logo size and font metrics, so it is
  // measured from the layout rather than hardcoded: with the pull-up removed,
  // the hero's document offset *is* the distance to close.
  useEffect(() => {
    const root = rootRef.current
    const page = root?.closest<HTMLElement>('.industry-page')
    if (!root || !page) return

    let applied = ''

    const measure = () => {
      page.style.setProperty('--ind-nav-overlap', '0px')
      const withoutPull = root.getBoundingClientRect().top + window.scrollY
      const next = `${Math.max(0, Math.round(withoutPull * 100) / 100)}px`

      page.style.setProperty('--ind-nav-overlap', next)
      applied = next
    }

    measure()
    // Re-measure when the header reflows (font swap, logo load, breakpoint),
    // but only touch the style when the value actually changes so the
    // observer cannot feed itself.
    const observer = new ResizeObserver(() => {
      const before = applied
      measure()
      if (applied === before) page.style.setProperty('--ind-nav-overlap', applied)
    })
    observer.observe(document.body)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      page.style.removeProperty('--ind-nav-overlap')
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current

    if (
      !root ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let active = true
    let cleanup: (() => void) | undefined

    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      if (!active || !root) return

      gsap.registerPlugin(ScrollTrigger)

      const context = gsap.context(() => {
        const canvas = root.querySelector<HTMLElement>('.industry-hero-canvas')
        const media = root.querySelector<HTMLElement>('.industry-hero-media')
        const shade = root.querySelector<HTMLElement>('.industry-hero-shade')
        const foot = root.querySelector<HTMLElement>('.industry-hero-foot')
        const panel = root.querySelector<HTMLElement>('.industry-hero-panel')
        const words = root.querySelectorAll<HTMLElement>('.industry-hero-word')
        const stats = root.querySelectorAll<HTMLElement>('.industry-hero-stat')

        // ------------------------------------------------------- entrance
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })

        if (canvas) {
          intro.fromTo(
            canvas,
            { filter: 'blur(12px)', scale: 1.14 },
            { duration: 1.9, ease: 'power2.out', filter: 'blur(0px)', scale: 1 },
            0,
          )
        }

        if (panel) {
          intro.fromTo(
            panel,
            { yPercent: 100 },
            { duration: 1.1, ease: 'power4.out', yPercent: 0 },
            0.25,
          )
        }

        if (words.length) {
          intro.fromTo(
            words,
            { rotate: 4, yPercent: 115 },
            { duration: 0.9, rotate: 0, stagger: 0.035, yPercent: 0 },
            0.55,
          )
        }

        if (stats.length) {
          intro.fromTo(
            stats,
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, duration: 0.9, stagger: 0.14, y: 0 },
            0.7,
          )

          stats.forEach((stat, index) => {
            const value = stat.querySelector<HTMLElement>('[data-count]')
            const target = Number(value?.dataset.count)

            if (!value || !Number.isFinite(target)) return

            const prefix = value.dataset.prefix ?? ''
            const suffix = value.dataset.suffix ?? ''
            const counter = { n: 0 }
            const render = () => {
              value.textContent = `${prefix}${Math.round(counter.n)}${suffix}`
            }

            intro.call(render, undefined, 0)
            intro.to(
              counter,
              { duration: 1.5, ease: 'power2.out', n: target, onUpdate: render },
              0.8 + index * 0.14,
            )
          })
        }

        // --------------------------------------------------- scroll scrub
        const scrub = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            end: 'bottom top',
            scrub: 0.6,
            start: 'top top',
            trigger: root,
          },
        })

        if (media) scrub.to(media, { scale: 1.08, yPercent: 22 }, 0)
        if (shade) scrub.to(shade, { opacity: 0.6 }, 0)
        if (foot) scrub.to(foot, { autoAlpha: 0, y: -56 }, 0.15)
      }, root)

      cleanup = () => context.revert()
    }

    void setup()

    return () => {
      active = false
      cleanup?.()
    }
  }, [])

  return (
    <section
      className={props.className}
      data-overlay-align={props.overlayAlign}
      id={props.id}
      ref={rootRef}
    >
      {props.children}
    </section>
  )
}
