'use client'

import { useEffect, useRef } from 'react'

import { SafeImg } from '@/components/atoms/SafeImage'
import type { MediaImage } from '@/data/media'
import type { FooterAddress } from '@/data/site'
import {
  defaultLocations,
  defaultLocationsImage,
  defaultLocationsTitle,
  splitAddress,
  telHref,
} from '@/data/homeLocationsDefaults'
// Type-only, so the Payload client stays out of the browser bundle.
import type { HomeLocationsLayoutBlock } from '@/data/home'

import { onFirstMediaMatch, watchHeaderCondense } from './scrollTriggerRefresh'

/**
 * The editorial composition -- image held in place while the copy scrolls
 * past it, with scroll-linked reveals -- runs only where it can be read as
 * one: a wide viewport and no reduced-motion preference. Everywhere else the
 * same markup is a plain stack with everything already in place.
 */
export const LOCATIONS_SCENE_MEDIA = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

type Props = {
  /** Footer address rows, matched to the location defaults by position. */
  addresses?: FooterAddress[] | null
  /**
   * The CMS block, when the home page carries one. Its facilities and
   * photograph override the Footer's; everything it leaves empty has already
   * been filled from the committed defaults by the data layer.
   */
  block?: HomeLocationsLayoutBlock
  /** Uploaded in the admin (Footer → Locations image); falls back to the committed photo. */
  image?: MediaImage | null
}

export function HomeLocationsSection({ addresses, block, image }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const copyRef = useRef<HTMLDivElement | null>(null)

  // Block, then the Footer, then the committed photograph.
  const picture = block?.image?.url ? block.image : image?.url ? image : defaultLocationsImage
  const title = block?.title ?? defaultLocationsTitle
  /*
   * Facilities are edited on the Footer, so the block's rows are an override
   * for this page alone: filled in they win, empty the Footer rows are matched
   * to the defaults by position, as before.
   */
  const locations = block?.locations?.length
    ? block.locations
    : defaultLocations.map((location, index) => {
        const row = addresses?.[index]
        const address = row?.address?.trim()
        return {
          ...location,
          addressLines: address ? splitAddress(address) : location.addressLines,
          phone: row?.phone?.trim() || location.phone,
        }
      })

  useEffect(() => {
    const section = sectionRef.current
    const media = mediaRef.current
    const copy = copyRef.current
    if (!section || !media || !copy) return

    let active = true
    let cleanup: (() => void) | undefined

    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (!active || !section || !media || !copy) return

      gsap.registerPlugin(ScrollTrigger)
      const stopWatching = watchHeaderCondense(ScrollTrigger)
      const match = gsap.matchMedia()

      match.add(LOCATIONS_SCENE_MEDIA, () => {
        const picture = imageRef.current
        const titleLines = Array.from(copy.querySelectorAll<HTMLElement>('.locations-title-line'))
        const reach = copy.querySelector<HTMLElement>('.locations-reach')
        const items = Array.from(copy.querySelectorAll<HTMLElement>('.locations-item'))
        const context = gsap.context(() => {
          /*
           * No pin anywhere: the image is CSS-sticky and every movement is a
           * scrubbed tween on plain page scroll, so the wheel is never taken,
           * the section after it rises in on its own, and scrolling back up
           * runs everything in reverse.
           *
           * Every reveal is deliberately short -- a third of a viewport of
           * travel, opacity and a small lift, nothing more. The composition
           * has to be readable within a compact scroll, not spread over
           * screens of white, so the reveals sit close behind each other:
           * headline as the section arrives, then each facility as it rises.
           */
          const entrance = gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              end: 'top 48%',
              invalidateOnRefresh: true,
              scrub: 0.6,
              start: 'top 88%',
              trigger: section,
            },
          })
          entrance.fromTo(
            media,
            { opacity: 0, y: 32 },
            { duration: 0.55, immediateRender: true, opacity: 1, y: 0 },
            0,
          )
          titleLines.forEach((line, index) => {
            entrance.fromTo(
              line,
              { opacity: 0, y: 26 },
              { duration: 0.5, immediateRender: true, opacity: 1, y: 0 },
              0.1 + index * 0.1,
            )
          })
          if (reach) {
            entrance.fromTo(
              reach,
              { opacity: 0, y: 16 },
              { duration: 0.4, immediateRender: true, opacity: 1, y: 0 },
              0.35,
            )
          }

          // The photograph drifts a little against the frame across the whole
          // section, so the held image is never quite static.
          if (picture) {
            gsap.fromTo(
              picture,
              { yPercent: -4 },
              {
                ease: 'none',
                immediateRender: true,
                scrollTrigger: {
                  end: 'bottom top',
                  invalidateOnRefresh: true,
                  scrub: true,
                  start: 'top bottom',
                  trigger: section,
                },
                yPercent: 4,
              },
            )
          }

          // Each facility as it rises: the rule draws out from the copy's
          // edge and the name and address lift in just behind it.
          items.forEach((item) => {
            const rule = item.querySelector<HTMLElement>('.locations-rule')
            const words = item.querySelectorAll<HTMLElement>('.locations-name, .locations-detail')
            const reveal = gsap.timeline({
              defaults: { ease: 'power2.out' },
              scrollTrigger: {
                /*
                 * Short on purpose, and finished high: a facility has to be
                 * fully formed by the time the image locks and the layout
                 * settles, and at that moment the second one is still three
                 * quarters of the way down the screen.
                 */
                end: 'top 74%',
                invalidateOnRefresh: true,
                scrub: 0.6,
                start: 'top 92%',
                trigger: item,
              },
            })
            if (rule) {
              reveal.fromTo(
                rule,
                { scaleX: 0 },
                { duration: 0.55, immediateRender: true, scaleX: 1 },
                0,
              )
            }
            reveal.fromTo(
              words,
              { opacity: 0, y: 24 },
              { duration: 0.5, immediateRender: true, opacity: 1, stagger: 0.05, y: 0 },
              0.1,
            )
          })
        }, section)

        return () => {
          // Reverts every tween and its inline styles, and kills the triggers.
          context.revert()
        }
      })

      cleanup = () => {
        stopWatching()
        match.revert()
      }
      ScrollTrigger.refresh()
    }

    // GSAP is only fetched once the composition can play.
    const cancelStart = onFirstMediaMatch(LOCATIONS_SCENE_MEDIA, () => void setup())

    return () => {
      cancelStart()
      active = false
      cleanup?.()
    }
  }, [])

  return (
    <section
      aria-labelledby="locations-title"
      className="locations"
      data-nav-surface="white"
      data-responsive-layout="locations"
      data-scroll-scene="locations"
      id="locations"
      ref={sectionRef}
    >
      <div className="locations-inner">
        <div className="locations-grid">
          <figure className="locations-media">
            <div className="locations-media-frame" ref={mediaRef}>
              <div className="locations-media-image" ref={imageRef}>
                <SafeImg alt={picture.alt} src={picture.url} />
              </div>
              {/* Oversized country mark, set over the foot of the photograph. */}
              <span aria-hidden="true" className="locations-media-mark">
                UAE
              </span>
            </div>
          </figure>

          <div className="locations-copy" ref={copyRef}>
            <header className="locations-head">
              <h2 className="locations-title" id="locations-title">
                <span className="locations-title-line">{title.lead}</span>
                <span className="locations-title-line locations-title-line--light">
                  {title.reach}
                </span>
              </h2>
              <p className="locations-reach">
                {title.regions.map((region, index) => (
                  <span key={region}>
                    {index > 0 ? <span className="locations-reach-dot">·</span> : null}
                    {region}
                  </span>
                ))}
              </p>
            </header>

            <ol className="locations-list">
              {locations.map((location, index) => (
                <li className="locations-item" data-location={index + 1} key={location.name}>
                  {/* Name and rule share a box the width of the words, so the
                      rule ends with the name and runs back to the copy edge. */}
                  <div className="locations-item-head">
                    <h3 className="locations-name">
                      <strong>{location.name}</strong>
                      <span>{location.kind}</span>
                    </h3>
                    <span aria-hidden="true" className="locations-rule" />
                  </div>
                  <div className="locations-detail">
                    <p className="locations-address">
                      {location.addressLines.map((line, lineIndex) => (
                        <span key={`${line}-${lineIndex}`}>
                          {lineIndex > 0 ? <br /> : null}
                          {line}
                        </span>
                      ))}
                    </p>
                    <a className="locations-phone" href={telHref(location.phone)}>
                      {location.phone}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
