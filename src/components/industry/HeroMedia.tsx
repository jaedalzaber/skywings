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
 * the video replaces it once it can actually play. That ordering is what
 * makes every failure mode graceful: blocked autoplay, a 404, a slow
 * connection, or reduced-motion all simply leave the poster showing, with no
 * flash of empty space and no layout shift.
 *
 * The handover is a cut, not a cross-fade: the poster is the video's first
 * frame, so swapping them outright is invisible, while fading one over the
 * other reads as a second animation on top of the hero's entrance. Three
 * things have to line up for it:
 *
 *  - the entrance has finished (the picture is done settling; HeroMotion
 *    marks the section, and a timeout covers the case where it never runs),
 *  - the video can play,
 *  - the hero is on screen.
 *
 * Playback only starts at that moment, from the first frame, so the cut lands
 * on the same image the poster was showing rather than two seconds in.
 */
export function HeroMedia(props: HeroMediaProps) {
  const { mediaDescription, mobileVideoUrl, posterAlt, posterUrl, priority, videoType, videoUrl } =
    props
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [source, setSource] = useState<null | string>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [entered, setEntered] = useState(false)
  const [visible, setVisible] = useState(false)
  // Once the cut has happened the video stays on top: no flicker back to the
  // poster when the hero scrolls out and playback pauses.
  const [showVideo, setShowVideo] = useState(false)

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

  /*
   * Waits for the hero's entrance. HeroMotion sets data-hero-entered when its
   * intro timeline finishes; the timeout is the backstop for a page where
   * that never happens at all (GSAP failed to load, reduced motion), so the
   * video is never held back for good.
   */
  useEffect(() => {
    const hero = containerRef.current?.closest<HTMLElement>('.industry-hero')
    if (!hero) return setEntered(true)
    if (hero.dataset.heroEntered === 'true') return setEntered(true)

    const observer = new MutationObserver(() => {
      if (hero.dataset.heroEntered === 'true') setEntered(true)
    })
    observer.observe(hero, { attributeFilter: ['data-hero-entered'] })
    const fallback = window.setTimeout(() => setEntered(true), 2600)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  // Stop decoding frames for a hero nobody is looking at.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !source) return

    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), {
      threshold: 0.15,
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [source])

  // The handover itself, and every later pause and resume.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!(entered && canPlay && visible)) {
      if (!video.paused) video.pause()
      return
    }

    // From the top, so the cut lands on the frame the poster is showing.
    if (!showVideo && video.currentTime > 0) video.currentTime = 0
    void video.play().catch(() => undefined)
    setShowVideo(true)
  }, [canPlay, entered, showVideo, visible])

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
          data-ready={showVideo ? 'true' : 'false'}
          loop
          muted
          onCanPlay={() => setCanPlay(true)}
          onError={() => {
            setCanPlay(false)
            setShowVideo(false)
            setSource(null)
          }}
          playsInline
          preload="auto"
          ref={videoRef}
        >
          <source src={source} type={videoType ?? undefined} onError={() => setSource(null)} />
        </video>
      ) : null}
    </div>
  )
}
