'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

type ServiceCard = {
  accentTitle?: boolean
  image: string
  number: string
  title: string
}

const serviceCards: ServiceCard[] = [
  {
    image: '/images/home/service-01.png',
    number: '01',
    title: 'Custom Equipment Manufacturing',
  },
  {
    image: '/images/home/service-02.png',
    number: '02',
    title: 'Structural Steel Fabrication',
  },
  {
    image: '/images/home/service-03.png',
    number: '03',
    title: 'Metal Product Fabrication',
  },
  {
    image: '/images/home/service-04.png',
    number: '04',
    title: 'Custom Equipment Manufacturing',
  },
  {
    accentTitle: true,
    image: '/images/home/service-05.png',
    number: '05',
    title: 'Erection',
  },
]

export function HomeServicesScroller() {
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
              <p className="services-showcase-eyebrow">Our Services</p>
              <h2 id="services-showcase-title">What We Do</h2>
            </div>

            <div className="services-showcase-copy">
              <p>
                Sky Wings provides <strong>End-to-End Metal Manufacturing</strong>. We take a{' '}
                <strong>requirement</strong> - a drawing, a sample, a concept, or a problem to
                solve - and convert it into a <strong>manufactured product</strong>.
              </p>
              <p>Our services cover every major stage of metal production under one roof.</p>
            </div>
          </div>
        </div>

        <div className="services-showcase-viewport" ref={viewportRef}>
          <div className="services-showcase-track" ref={trackRef}>
            {serviceCards.map((card) => (
              <article className="services-showcase-card" key={card.number}>
                <p className="services-showcase-card-number">{card.number}</p>
                <div className="services-showcase-card-surface">
                  <Image
                    alt=""
                    className="services-showcase-card-image"
                    fill
                    loading="lazy"
                    sizes="(max-width: 767px) 66vw, (max-width: 1439px) 26vw, 24rem"
                    src={card.image}
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
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
