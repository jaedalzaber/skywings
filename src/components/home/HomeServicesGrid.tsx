'use client'

import { useEffect, useRef, useState } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import type { HomeServiceCard, HomeServicesLayoutBlock } from '@/data/home'

/**
 * Hover artwork is mounted only while the card is active, so a GIF starts at
 * its first frame every time instead of joining a loop already in progress.
 * The cost is a request on first hover, which is also the point -- six
 * animations are not downloaded for a visitor who never hovers one.
 */
function ServiceCard(props: { card: HomeServiceCard; motionAllowed: boolean }) {
  const { card, motionAllowed } = props
  const [active, setActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const hover = motionAllowed ? card.hoverMedia : null
  const hoverIsVideo = Boolean(hover?.mimeType?.startsWith('video/'))

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (active) {
      video.currentTime = 0
      // Autoplay can still be refused (low power mode); the image stays under it.
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [active])

  return (
    <RevealItem
      as="article"
      className="services-grid-card"
      data-active={hover && active ? 'true' : undefined}
      onBlur={() => setActive(false)}
      onFocus={() => setActive(true)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div className="services-grid-card-media">
        <Image
          alt={card.image?.alt ?? ''}
          className="services-grid-card-image"
          fill
          loading="lazy"
          sizes="(max-width: 47.999rem) 100vw, (max-width: 63.999rem) 50vw, 33vw"
          src={card.image?.url || card.fallbackImage}
        />

        {hover && active ? (
          hoverIsVideo ? (
            <video
              aria-hidden="true"
              className="services-grid-card-motion"
              loop
              muted
              playsInline
              preload="none"
              ref={videoRef}
              src={hover.url}
            />
          ) : (
            /*
             * Deliberately a plain <img>: next/image would rewrite a GIF
             * through the optimizer and hand back a still first frame.
             */
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" aria-hidden="true" className="services-grid-card-motion" src={hover.url} />
          )
        ) : null}
      </div>

      <p className="services-grid-card-label">{card.title}</p>
    </RevealItem>
  )
}

export function HomeServicesGrid(props: { block: HomeServicesLayoutBlock }) {
  const { block } = props
  const [motionAllowed, setMotionAllowed] = useState(true)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setMotionAllowed(!query.matches)

    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const segments = block.headingSegments ?? []

  return (
    <section
      aria-labelledby="services-grid-title"
      className="services-grid"
      // The band is #1c1c1c, so the bar needs its light-on-dark treatment while
      // it is over this section. HeaderSurfaceController mirrors this onto
      // <html> and the theming is pure CSS from there.
      data-nav-surface="dark"
      data-responsive-layout="services"
    >
      <div className="services-grid-inner">
        <Reveal as="h2" className="services-grid-heading" id="services-grid-title">
          {segments.length ? (
            segments.map((segment, index) => (
              <span
                className={segment.emphasis ? 'services-grid-heading-strong' : undefined}
                key={segment.id ?? `${segment.text}-${index}`}
              >
                {segment.text}
              </span>
            ))
          ) : (
            <span className="services-grid-heading-strong">{block.heading}</span>
          )}
        </Reveal>

        {/* The tiles come in one after another rather than as a block, which
            reads as a set being laid out rather than a page loading. */}
        <RevealGroup className="services-grid-list" stagger={0.07}>
          {block.cards.map((card, index) => (
            <ServiceCard
              card={card}
              key={card.id ?? `${card.title}-${index}`}
              motionAllowed={motionAllowed}
            />
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
