import { Fragment } from 'react'

import { ButtonLink } from '@/components/atoms/ButtonLink'
import { SafePicture, SafeVideo } from '@/components/atoms/SafeImage'
import { Reveal, RevealGroup, RevealItem, RevealWords } from '@/components/motion/Reveal'
import {
  defaultHomeServicesBlock,
  type HomeHeroLayoutBlock,
  type HomeIndustriesLayoutBlock,
  type HomeLayout,
  type HomeEngineeringLayoutBlock,
  type HomeLocationsLayoutBlock,
  type HomeMachiningLayoutBlock,
  type HomeProcessLayoutBlock,
  type HomeServicesLayoutBlock,
} from '@/data/home'
import type { ArticleCard } from '@/data/articles'
import type { MediaImage } from '@/data/media'
import type { FooterAddress } from '@/data/site'

import { HomeIndustriesAccordion } from './HomeIndustriesAccordion'
import { HeroYouTubeBackground } from './HeroYouTubeBackground'
import { HomeEngineeringSection } from './HomeEngineeringSection'
import { HomeInsightsSection } from './HomeInsightsSection'
import { HomeLocationsSection } from './HomeLocationsSection'
import { HomeMachiningSection } from './HomeMachiningSection'
import { HomeProcessSection } from './HomeProcessSection'
import { HomeServicesGrid } from './HomeServicesGrid'

function optionalText(value: string | null | undefined, fallback = '') {
  return value || fallback
}

/* Aviation leads here as it does in every other listing -- see
   INDUSTRY_PRIORITY in productTaxonomy.ts. */
const heroServices = [
  'Aviation Ground Support Equipment',
  'Construction & Infrastructure',
  'Heavy Equipment & Machinery',
  'Industrial Manufacturing',
  'Custom Metal Fabrication',
  'Architectural & Interior Metalwork',
]

function HeroCoverVideo(props: {
  className: string
  poster?: string | null
  type?: 'image' | 'video' | null
  video?: HomeHeroLayoutBlock['desktopCoverVideo']
}) {
  const { className, poster, type, video } = props

  if (type !== 'video' || !video?.url) {
    return null
  }

  return (
    <SafeVideo
      autoPlay
      className={`hero-cover-video ${className}`}
      crossOrigin="anonymous"
      loop
      playsInline
      poster={poster ?? undefined}
      preload="auto"
      sourceType={video.mimeType}
      src={video.url}
    />
  )
}

/**
 * Facility addresses and the locations photograph are edited on the Footer
 * global, not the home page, so the page passes them in beside the layout.
 * Optional: the section falls back to committed defaults without them.
 */
export type HomeLocationsProps = {
  addresses?: FooterAddress[] | null
  image?: MediaImage | null
}

/*
 * The hero renders the whole landing page in one pass, so it needs every
 * section's block in hand. Collected once here and passed down together
 * rather than as a growing list of arguments; each is optional, and a section
 * without a block falls back to its committed defaults.
 */
type HomeSectionBlocks = {
  engineering?: HomeEngineeringLayoutBlock
  industries?: HomeIndustriesLayoutBlock
  locationsBlock?: HomeLocationsLayoutBlock
  machining?: HomeMachiningLayoutBlock
  process?: HomeProcessLayoutBlock
  services?: HomeServicesLayoutBlock
}

export function HomeBlockRenderer(props: {
  blocks: HomeLayout
  /** Articles for the resources section, picked by the page. None: no section. */
  insights?: readonly ArticleCard[]
  locations?: HomeLocationsProps
}) {
  const sections: HomeSectionBlocks = {
    engineering: props.blocks.find(
      (block): block is HomeEngineeringLayoutBlock => block.blockType === 'homeEngineering',
    ),
    industries: props.blocks.find(
      (block): block is HomeIndustriesLayoutBlock => block.blockType === 'homeIndustries',
    ),
    locationsBlock: props.blocks.find(
      (block): block is HomeLocationsLayoutBlock => block.blockType === 'homeLocations',
    ),
    machining: props.blocks.find(
      (block): block is HomeMachiningLayoutBlock => block.blockType === 'homeMachining',
    ),
    process: props.blocks.find(
      (block): block is HomeProcessLayoutBlock => block.blockType === 'homeProcess',
    ),
    services: props.blocks.find(
      (block): block is HomeServicesLayoutBlock => block.blockType === 'homeServices',
    ),
  }
  const heroRendersHomeSections = props.blocks.some((block) => block.blockType === 'homeHero')

  return (
    <>
      {props.blocks.map((block, index) =>
        renderHomeBlock(
          block,
          index,
          sections,
          heroRendersHomeSections,
          props.locations,
          props.insights ?? [],
        ),
      )}
    </>
  )
}

function renderHomeBlock(
  block: HomeLayout[number],
  index: number,
  sections: HomeSectionBlocks,
  heroRendersHomeSections: boolean,
  locations: HomeLocationsProps | undefined,
  insights: readonly ArticleCard[],
) {
  const key = `${block.blockType}-${block.id ?? index}`

  switch (block.blockType) {
    case 'homeHero':
      return (
        <HomeHero
          key={key}
          block={block}
          insights={insights}
          locations={locations}
          sections={sections}
        />
      )
    case 'homeServices':
      if (heroRendersHomeSections && sections.services === block) {
        return null
      }

      return <HomeServicesGrid key={key} block={block} />
    case 'homeIndustries':
      if (heroRendersHomeSections && sections.industries === block) {
        return null
      }

      return <HomeIndustries key={key} block={block} />
    case 'homeMachining':
      if (heroRendersHomeSections && sections.machining === block) return null
      return <HomeMachiningSection key={key} block={block} />
    case 'homeEngineering':
      if (heroRendersHomeSections && sections.engineering === block) return null
      return <HomeEngineeringSection key={key} block={block} />
    case 'homeProcess':
      if (heroRendersHomeSections && sections.process === block) return null
      return <HomeProcess key={key} block={block} />
    case 'homeLocations':
      if (heroRendersHomeSections && sections.locationsBlock === block) return null
      return (
        <Fragment key={key}>
          <HomeLocationsSection
            addresses={locations?.addresses}
            block={block}
            image={locations?.image}
          />
          <HomeInsightsSection articles={insights} />
        </Fragment>
      )
    default:
      return null
  }
}

function HomeHero(props: {
  block: HomeHeroLayoutBlock
  insights: readonly ArticleCard[]
  locations?: HomeLocationsProps
  sections: HomeSectionBlocks
}) {
  const { block, sections } = props
  const {
    engineering: engineeringBlock,
    industries: industriesBlock,
    locationsBlock,
    machining: machiningBlock,
    process: processBlock,
    services: servicesBlock = defaultHomeServicesBlock,
  } = sections

  return (
    <>
      {/* The bar floats over the footage here and carries no ground of its
          own; see html[data-nav-surface='hero'] in styles.css. */}
      <section
        aria-label="Sky Wings hero"
        className="hero-section hero-container"
        data-nav-surface="hero"
        data-responsive-layout="hero"
        id="top"
      >
        <div className="hero-video-layer" aria-hidden="true">
          <SafePicture
            className="hero-image"
            image={{
              alt: block.mobileCoverImage?.alt ?? '',
              crossOrigin: 'anonymous',
              src: block.mobileCoverImage?.url ?? '/images/home/hero-mobile.png',
            }}
            sources={[
              {
                media: '(min-width: 90rem)',
                srcSet: block.desktopCoverImage?.url ?? '/images/home/hero-desktop.png',
              },
              {
                media: '(min-width: 48rem)',
                srcSet: block.laptopCoverImage?.url ?? '/images/home/hero-laptop.png',
              },
            ]}
          />
          {block.youtubeVideoId ? (
            <HeroYouTubeBackground videoId={block.youtubeVideoId} />
          ) : (
            <>
              <HeroCoverVideo
                className="hero-cover-video--mobile"
                poster={block.mobileCoverImage?.url ?? '/images/home/hero-mobile.png'}
                type={block.mobileCoverType}
                video={block.mobileCoverVideo}
              />
              <HeroCoverVideo
                className="hero-cover-video--laptop"
                poster={block.laptopCoverImage?.url ?? '/images/home/hero-laptop.png'}
                type={block.laptopCoverType}
                video={block.laptopCoverVideo}
              />
              <HeroCoverVideo
                className="hero-cover-video--desktop"
                poster={block.desktopCoverImage?.url ?? '/images/home/hero-desktop.png'}
                type={block.desktopCoverType}
                video={block.desktopCoverVideo}
              />
            </>
          )}
          <div className="hero-video-placeholder" />
        </div>

        <div className="hero-content-band">
          {/*
           * The hero is already on screen, so this plays on load rather than
           * on scroll: the copy settles in over the footage a beat after it
           * starts, which is what makes the two read as one shot.
           */}
          {/*
           * One sequence over the whole panel rather than two blocks fading
           * in: the eyebrow, then the headline a word at a time, then the
           * summary and its buttons. The stagger runs through the plain
           * wrappers between them, because the order comes from the React
           * tree rather than the DOM -- so the copy reads as it is set down,
           * which is the point of the beat between each part.
           */}
          <RevealGroup amount={0} className="hero-content" delay={0.2} stagger={0.055}>
            <div className="hero-copy">
              {/* The Eyebrow atom's markup, staged as its own beat. */}
              {block.eyebrow ? (
                <RevealItem as="p" className="eyebrow">
                  {block.eyebrow}
                </RevealItem>
              ) : null}
              <h1>
                <RevealWords text={block.heading} />
              </h1>
            </div>

            <div className="hero-summary">
              <RevealItem as="p" className="hero-text">
                {optionalText(block.description)}
              </RevealItem>
              <RevealItem as="div" className="hero-actions">
                {block.primaryLabel && block.primaryHref ? (
                  <ButtonLink href={block.primaryHref} variant="primary">
                    {block.primaryLabel}
                  </ButtonLink>
                ) : null}
                {block.secondaryLabel && block.secondaryHref ? (
                  <ButtonLink href={block.secondaryHref} variant="secondary">
                    {block.secondaryLabel}
                  </ButtonLink>
                ) : null}
              </RevealItem>
            </div>
          </RevealGroup>

          <Reveal
            amount={0}
            aria-label="Services carousel"
            className="hero-services-marquee"
            delay={0.55}
            motion="fade"
          >
            <div className="hero-services-rail">
              {[0, 1].map((trackIndex) => (
                <div
                  className="hero-services-track"
                  key={trackIndex}
                  aria-hidden={trackIndex === 1 ? 'true' : undefined}
                >
                  {heroServices.map((service) => (
                    <span className="hero-service-label" key={`${trackIndex}-${service}`}>
                      {service}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <HomeServicesGrid block={servicesBlock} />
      {industriesBlock ? <HomeIndustriesAccordion block={industriesBlock} /> : null}
      {/* The capability run: the machines, then the engineering that drives
          them, then the process they sit inside. Both leading sections are
          committed defaults, as with the locations section. */}
      <HomeMachiningSection block={machiningBlock} />
      <HomeEngineeringSection block={engineeringBlock} />
      {processBlock ? <HomeProcessSection block={processBlock} /> : null}
      {/* Where the shop is, straight after how it works; then what it has
          learned, written down, to close the page. */}
      {processBlock ? (
        <HomeLocationsSection
          addresses={props.locations?.addresses}
          block={locationsBlock}
          image={props.locations?.image}
        />
      ) : null}
      {processBlock ? <HomeInsightsSection articles={props.insights} /> : null}
    </>
  )
}

function HomeIndustries(props: { block: HomeIndustriesLayoutBlock }) {
  const { block } = props

  return <HomeIndustriesAccordion block={block} />
}

function HomeProcess(props: { block: HomeProcessLayoutBlock }) {
  return <HomeProcessSection block={props.block} />
}
