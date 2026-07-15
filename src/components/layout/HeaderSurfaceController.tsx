'use client'

import { useEffect } from 'react'

const whiteSurfaceSelector = '[data-nav-surface="white"]'

export function HeaderSurfaceController() {
  useEffect(() => {
    const root = document.documentElement
    const header = document.querySelector<HTMLElement>('.nav-container')
    const sections = [...document.querySelectorAll<HTMLElement>(whiteSurfaceSelector)]

    if (!header || sections.length === 0) return

    let frame = 0

    const updateSurface = () => {
      frame = 0
      const headerBounds = header.getBoundingClientRect()
      const headerProbe = headerBounds.top + headerBounds.height / 2
      const isOverWhiteSurface = sections.some((section) => {
        const bounds = section.getBoundingClientRect()
        return bounds.top <= headerProbe && bounds.bottom >= headerProbe
      })

      if (isOverWhiteSurface) {
        root.dataset.sectionNavActive = 'true'
      } else {
        delete root.dataset.sectionNavActive
      }
    }

    const scheduleUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateSurface)
    }

    updateSurface()
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate)
      if (frame) window.cancelAnimationFrame(frame)
      delete root.dataset.sectionNavActive
    }
  }, [])

  return null
}
