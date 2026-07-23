'use client'

import { useEffect, useRef } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { HomeServicesLayoutBlock } from '@/data/home'

function serviceNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

export function HomeServicesScroller(props: { block: HomeServicesLayoutBlock }) {
  const { block } = props
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let active = true
    let cleanup: (() => void) | undefined

    async function setupAnimation() {
      if (
        !active ||
        !sectionRef.current ||
        !pinRef.current ||
        !viewportRef.current ||
        !trackRef.current ||
        typeof window === 'undefined' ||
        typeof window.matchMedia !== 'function'
      ) {
        return
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      if (
        !active ||
        !sectionRef.current ||
        !pinRef.current ||
        !viewportRef.current ||
        !trackRef.current
      ) {
        return
      }

      gsap.registerPlugin(ScrollTrigger)
      const media = gsap.matchMedia()

      const context = gsap.context(() => {
        // Scroll-scrubbed horizontal rail at every width, mobile included.
        media.add('(min-width: 0px)', () => {
          const section = sectionRef.current
          const pin = pinRef.current
          const viewport = viewportRef.current
          const track = trackRef.current

          if (!section || !pin || !viewport || !track) {
            return undefined
          }

          const getDistance = () => Math.max(track.scrollWidth - viewport.clientWidth, 0)
          const getEndDistance = () => Math.max(getDistance(), window.innerHeight * 0.72)

          if (getDistance() <= 0) {
            gsap.set(track, { clearProps: 'transform' })
            return undefined
          }

          const tween = gsap.to(track, {
            ease: 'none',
            overwrite: 'auto',
            immediateRender: false,
            x: () => -getDistance(),
            scrollTrigger: {
              anticipatePin: 1,
              end: () => `+=${getEndDistance()}`,
              invalidateOnRefresh: true,
              pin,
              scrub: 1.05,
              start: 'top top',
              trigger: section,
            },
          })

          return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            gsap.set(track, { clearProps: 'transform' })
          }
        })
      }, sectionRef)

      cleanup = () => {
        media.revert()
        context.revert()
      }

      ScrollTrigger.refresh()
    }

    void setupAnimation()

    return () => {
      active = false
      cleanup?.()
    }
  }, [])

  return (
    <section
      className="services-showcase"
      aria-labelledby="services-showcase-title"
      data-responsive-layout="services"
      ref={sectionRef}
    >
      <div className="services-showcase-pin" ref={pinRef}>
        <div className="services-showcase-shell">
          <div className="services-showcase-heading">
            <div className="services-showcase-title-group">
              {block.eyebrow ? <p className="services-showcase-eyebrow">{block.eyebrow}</p> : null}
              <h2 id="services-showcase-title">{block.heading}</h2>
            </div>

            <div className="services-showcase-copy">
              {block.description ? <p>{block.description}</p> : null}
              {block.secondaryDescription ? <p>{block.secondaryDescription}</p> : null}
            </div>
          </div>
        </div>

        <div className="services-showcase-viewport" ref={viewportRef}>
          <div className="services-showcase-track" ref={trackRef}>
            {block.cards.map((card, index) => {
              const imageSrc = card.image?.url || card.fallbackImage

              return (
                <article
                  className="services-showcase-card"
                  key={card.id ?? `${card.title}-${index}`}
                >
                  <p className="services-showcase-card-number">{serviceNumber(index)}</p>
                  <div className="services-showcase-card-surface">
                    <Image
                      alt={card.image?.alt ?? ''}
                      className="services-showcase-card-image"
                      fill
                      loading="lazy"
                      sizes="(max-width: 767px) 66vw, (max-width: 1439px) 26vw, 24rem"
                      src={imageSrc}
                    />
                    <h3
                      className={
                        card.accentTitle
                          ? 'services-showcase-card-title light'
                          : 'services-showcase-card-title'
                      }
                    >
                      {card.title}
                    </h3>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
