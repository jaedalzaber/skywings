'use client'

import { useEffect } from 'react'

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
        syncTouch: false,
        wheelMultiplier: 0.92,
      })

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
