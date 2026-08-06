'use client'

import { useEffect, useRef, useState } from 'react'

type HeroMediaProps = {
  mediaDescription: string
  mobileVideoUrl?: null | string
  posterAlt: string
  posterUrl: string
  priority?: boolean
  videoType?: null | string
  videoUrl?: null | string
}

/**
 * Poster-first hero media.
 *
 * The poster is a plain <img> that paints immediately and is never removed —
 * the video fades in on top of it once it can actually play. That ordering is
 * what makes every failure mode graceful: blocked autoplay, a 404, a slow
 * connection, or reduced-motion all simply leave the poster showing, with no
 * flash of empty space and no layout shift.
 */
export function HeroMedia(props: HeroMediaProps) {
  const { mediaDescription, mobileVideoUrl, posterAlt, posterUrl, priority, videoType, videoUrl } =
    props

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [source, setSource] = useState<null | string>(null)
  const [ready, setReady] = useState(false)

  // Pick the source on the client so a phone never downloads the desktop cut.
  // Deferred to an effect (rather than SSR) because the choice depends on the
  // viewport, and guessing it on the server would mean fetching both.
  useEffect(() => {
    if (!videoUrl) return

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return

    const narrowQuery = window.matchMedia('(max-width: 47.999rem)')
    const choose = () => setSource(narrowQuery.matches && mobileVideoUrl ? mobileVideoUrl : videoUrl)

    choose()
    narrowQuery.addEventListener('change', choose)
    return () => narrowQuery.removeEventListener('change', choose)
  }, [mobileVideoUrl, videoUrl])

  // Stop decoding frames for a hero nobody is looking at.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !source) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current
        if (!video) return

        if (entry?.isIntersecting) {
          video.play().catch(() => undefined)
        } else if (!video.paused) {
          video.pause()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [source])

  return (
    <div className="industry-hero-media" ref={containerRef}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the poster must
          paint on first frame without the optimizer in the path; SafeImage
          cannot express the "stays underneath the video" fallback this needs. */}
      <img
        alt={posterAlt}
        className="industry-hero-poster"
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        src={posterUrl}
      />

      {source ? (
        <video
          aria-label={mediaDescription}
          className="industry-hero-video"
          data-ready={ready ? 'true' : 'false'}
          loop
          muted
          onCanPlay={() => setReady(true)}
          onError={() => {
            setReady(false)
            setSource(null)
          }}
          playsInline
          preload="none"
          ref={videoRef}
        >
          <source src={source} type={videoType ?? undefined} onError={() => setSource(null)} />
        </video>
      ) : null}
    </div>
  )
}
