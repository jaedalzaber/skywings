import { Fragment } from 'react'

import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem, RevealWords } from '@/components/motion/Reveal'
import type { MediaImage } from '@/data/media'
import type { FooterAddress } from '@/data/site'
import {
  defaultLocations,
  defaultLocationsTitle,
  splitAddress,
  telHref,
} from '@/data/homeLocationsDefaults'
// Type-only, so the Payload client stays out of the browser bundle.
import type { HomeLocationsLayoutBlock } from '@/data/home'

type Props = {
  /** Footer address rows, matched to the location defaults by position. */
  addresses?: FooterAddress[] | null
  /**
   * The CMS block, when the home page carries one. Its facilities and
   * photograph override the Footer's; everything it leaves empty has already
   * been filled from the committed defaults by the data layer.
   */
  block?: HomeLocationsLayoutBlock
  /** Uploaded in the admin (Footer → Locations image). */
  image?: MediaImage | null
  /** White on the home page; dark where the whole page is, as on Contact. */
  tone?: 'dark' | 'light'
}

/**
 * Where Sky Wings ships from and to, closing the home page.
 *
 * A portrait aerial of the UAE with the country set large across its foot, and
 * beside it the reach -- "Made in the UAE, delivered across the Middle East,
 * Europe & Africa" --
 * over the two branches. The branches step down and to the right, each under a
 * blue rule that runs back to the edge of the copy, so the pair read as two
 * stops on one line out from the picture.
 *
 * Nothing here is held or scrubbed: the parts arrive once as they come into
 * view, through the same reveal primitives as every other home section, and a
 * reduced-motion preference leaves them in place.
 */
export function HomeLocationsSection({ addresses, block, image, tone = 'light' }: Props) {
  // The block's photograph, then the Footer's. With neither, the frame's own
  // sky-toned ground carries the country mark until one is uploaded.
  const picture = block?.image?.url ? block.image : image?.url ? image : null
  const title = block?.title ?? defaultLocationsTitle
  /*
   * Facilities are edited on the Footer, so the block's rows are an override
   * for this page alone: filled in they win, empty the Footer rows are matched
   * to the defaults by position.
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

  return (
    <section
      aria-labelledby="locations-title"
      className="locations"
      data-nav-surface={tone === 'dark' ? 'dark' : 'white'}
      data-responsive-layout="locations"
      data-tone={tone === 'dark' ? 'dark' : undefined}
      id="locations"
    >
      <div className="locations-inner">
        <div className="locations-grid">
          {/*
           * The figure watches for the viewport; the frame inside it opens like
           * a shutter. A clipped element cannot watch for itself -- fully
           * clipped, it never counts as in view, so it would never open.
           */}
          <RevealGroup as="figure" className="locations-media" delay={0} stagger={0.4}>
            <RevealItem className="locations-media-frame" motion="shutter">
              {picture ? <SafeImg alt={picture.alt} src={picture.url} /> : null}
            </RevealItem>
            {/* The country, set as part of the picture rather than a caption. */}
            <RevealItem as="span" aria-hidden="true" className="locations-mark">
              <UaeMark />
            </RevealItem>
          </RevealGroup>

          <div className="locations-copy">
            <RevealGroup as="h2" className="locations-title" id="locations-title" stagger={0.05}>
              <span className="locations-title-lead">
                <RevealWords text={title.lead} />
              </span>{' '}
              <span className="locations-title-regions">
                <RegionWords regions={title.regions} />
              </span>
            </RevealGroup>

            <ol className="locations-list">
              {locations.map((location, index) => (
                <RevealGroup
                  as="li"
                  className="locations-item"
                  data-location={index + 1}
                  // Each branch a beat behind the one before, down the stair.
                  delay={0.1 + index * 0.18}
                  key={location.name}
                  stagger={0.09}
                >
                  {/* Name and rule share a box the width of the words, so the
                      rule ends with the name and runs back to the copy edge. */}
                  <div className="locations-item-head">
                    <RevealItem as="h3" className="locations-name">
                      <strong>{location.name}</strong> <span>{location.kind}</span>
                    </RevealItem>
                    <RevealItem
                      as="span"
                      aria-hidden="true"
                      className="locations-rule"
                      motion="line"
                    />
                  </div>
                  {/* One line of copy, left to wrap at the measure the design
                      sets rather than broken at every comma. */}
                  <RevealItem as="p" className="locations-address">
                    {location.addressLines.join(' ')}
                  </RevealItem>
                  <RevealItem as="p" className="locations-phone-line">
                    <a className="locations-phone" href={telHref(location.phone)}>
                      {location.phone}
                    </a>
                  </RevealItem>
                </RevealGroup>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The regions as the headline's heavy line: "Middle East, Europe & Africa".
 * The commas stay with the words; the ampersand is set light, as in the lead,
 * so the line reads as one list rather than three shouted names.
 */
function RegionWords({ regions }: { regions: string[] }) {
  return regions.map((region, index) => {
    const last = index === regions.length - 1
    const joiner = index === 0 ? null : last ? ' & ' : ', '

    return (
      <Fragment key={`${region}-${index}`}>
        {joiner === ' & ' ? (
          <>
            {' '}
            <RevealItem as="span" className="reveal-word locations-title-amp" motion="word">
              &amp;
            </RevealItem>{' '}
          </>
        ) : joiner ? (
          ' '
        ) : null}
        <RevealItem as="span" className="reveal-word" motion="word">
          {region}
          {!last && index < regions.length - 2 ? ',' : null}
        </RevealItem>
      </Fragment>
    )
  })
}

/** The "UAE" wordmark from the design, drawn rather than typeset. */
function UaeMark() {
  return (
    <svg fill="none" viewBox="0 0 249 97" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24.6064 56.8848C24.6064 69.0555 29.1042 75.2734 41.1426 75.2734C53.1807 75.2733 57.6787 69.0553 57.6787 56.8848V0H82.2842V55.4297C82.2841 82.8136 69.717 96.4393 41.1426 96.4395C12.5679 96.4395 3.03511e-05 82.8137 0 55.4297V0H24.6064V56.8848ZM171.702 92.5537V0.00683594H246.975V19.7188H196.308V36.2549H242.609V55.3047H196.308V73.2959H248.298V94.4619H171.702V94.4551H146.749L140.929 77.5225H107.988L102.035 94.4551H76.7676L112.089 0H137.092L171.702 92.5537ZM113.677 59.2656H135.107L124.656 26.1934H124.392L113.677 59.2656Z"
        fill="currentColor"
      />
    </svg>
  )
}
