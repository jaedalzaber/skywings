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

      /*
       * A percentage, not a rem: percentage translates resolve against the
       * image's own height, so the offset scales with the frame. These frames
       * range from a full-height hero to a 40px strip in the collapsed card
       * stack, and a fixed offset that looks right on the former shoves the
       * strip clean out of frame, leaving the placeholder grey showing. The
       * figure is paired with the scale() overscan in styles.css -- keep the
       * overscan the larger of the two or the edges show through.
       */
      frame.style.setProperty('--industry-media-y', `${clamped * -6}%`)
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
