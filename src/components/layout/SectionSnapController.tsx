'use client'

import { useEffect } from 'react'

const snapSectionSelector = '[data-scroll-snap="section"]'

type LenisLike = {
  scrollTo: (
    target: HTMLElement | number,
    options?: { duration?: number; force?: boolean; immediate?: boolean; lock?: boolean },
  ) => void
}

type WindowWithLenis = Window & {
  __skywingsLenis?: LenisLike
}

function isNearTop(value: number) {
  return Math.abs(value) < 8
}

export function SectionSnapController() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = [...document.querySelectorAll<HTMLElement>(snapSectionSelector)]

    if (sections.length === 0) return

    let frame = 0
    let lastScrollY = window.scrollY
    let snappingUntil = 0

    const snapToSection = (section: HTMLElement) => {
      snappingUntil = window.performance.now() + 850

      const lenis = (window as WindowWithLenis).__skywingsLenis

      if (lenis) {
        lenis.scrollTo(section, {
          duration: 0.72,
          force: true,
          lock: true,
        })
        return
      }

      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const updateSnap = () => {
      frame = 0

      const now = window.performance.now()

      if (now < snappingUntil) return

      const currentScrollY = window.scrollY
      const direction = currentScrollY >= lastScrollY ? 'down' : 'up'
      lastScrollY = currentScrollY

      const viewportHeight = window.innerHeight
      const section = sections.find((candidate) => {
        const bounds = candidate.getBoundingClientRect()

        if (isNearTop(bounds.top)) return false

        if (direction === 'down') {
          return bounds.top > 0 && bounds.top < viewportHeight * 0.42
        }

        return bounds.top < 0 && bounds.top > viewportHeight * -0.32
      })

      if (section) snapToSection(section)
    }

    const scheduleSnap = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateSnap)
    }

    window.addEventListener('scroll', scheduleSnap, { passive: true })
    window.addEventListener('resize', scheduleSnap)

    return () => {
      window.removeEventListener('scroll', scheduleSnap)
      window.removeEventListener('resize', scheduleSnap)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
