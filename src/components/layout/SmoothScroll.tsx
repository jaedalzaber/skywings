'use client'

import { useEffect } from 'react'

type WindowWithLenis = Window & {
  __skywingsLenis?: {
    destroy: () => void
    off: (event: 'scroll', callback: () => void) => void
    on: (event: 'scroll', callback: () => void) => void
    raf: (time: number) => void
    scrollTo: (
      target: HTMLElement | number,
      options?: { duration?: number; force?: boolean; immediate?: boolean; lock?: boolean },
    ) => void
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let mounted = true
    let frameId = 0
    let teardown: (() => void) | undefined

    async function setupSmoothScroll() {
      const [{ default: Lenis }, scrollTriggerModule] = await Promise.all([
        import('lenis'),
        import('gsap/ScrollTrigger').catch(() => null),
      ])

      if (!mounted) {
        return
      }

      const ScrollTrigger = scrollTriggerModule?.ScrollTrigger
      const lenis = new Lenis({
        duration: 1.1,
        lerp: 0.12,
        /*
         * Scroll natively inside anything that scrolls on its own. Lenis takes
         * every wheel event on the page, so without this the phone field's
         * country list moved the page behind it instead of its own options.
         * Our own markup can opt out with a data-lenis-prevent attribute; this
         * covers lists a library renders, where we cannot add one.
         */
        prevent: (node) =>
          node.classList.contains('react-international-phone-country-selector-dropdown'),
        syncTouch: false,
        wheelMultiplier: 0.92,
      })
      ;(window as WindowWithLenis).__skywingsLenis = lenis

      const onScroll = () => {
        ScrollTrigger?.update()
      }

      lenis.on('scroll', onScroll)

      const tick = (time: number) => {
        lenis.raf(time)
        frameId = window.requestAnimationFrame(tick)
      }

      frameId = window.requestAnimationFrame(tick)

      teardown = () => {
        window.cancelAnimationFrame(frameId)
        lenis.off('scroll', onScroll)
        delete (window as WindowWithLenis).__skywingsLenis
        lenis.destroy()
      }
    }

    void setupSmoothScroll()

    return () => {
      mounted = false
      teardown?.()
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  return null
}
