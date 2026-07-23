'use client'

import { useEffect, useRef } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { MediaImage } from '@/data/media'

export function IndustryHeroMedia(props: {
  className?: string
  image: MediaImage | null | undefined
}) {
  const { className, image } = props
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame || !image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let animationFrame = 0

    const update = () => {
      animationFrame = 0
      const rect = frame.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight
      const clamped = Math.max(-1, Math.min(1, progress))

      frame.style.setProperty('--industry-media-y', `${clamped * -8}rem`)
    }

    const requestUpdate = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [image])

  return (
    <div
      className={`industries-showcase-card-media${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      ref={frameRef}
    >
      {image ? (
        <Image
          alt=""
          className="industries-showcase-card-media-image"
          fill
          loading="lazy"
          sizes="(min-width: 48rem) 31vw, 100vw"
          src={image.url}
        />
      ) : null}
    </div>
  )
}
