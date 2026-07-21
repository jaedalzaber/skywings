import { ButtonLink } from '@/components/atoms/ButtonLink'
import { Eyebrow } from '@/components/atoms/Eyebrow'
import {
  type HomeHeroLayoutBlock,
  type HomeIndustriesLayoutBlock,
  type HomeLayout,
  type HomeProcessLayoutBlock,
} from '@/data/home'

import { HomeIndustriesAccordion } from './HomeIndustriesAccordion'
import { HomeGlobeSection } from './HomeGlobeSection'
import { HomeProcessSection } from './HomeProcessSection'
import { HomeServicesScroller } from './HomeServicesScroller'

function optionalText(value: string | null | undefined, fallback = '') {
  return value || fallback
}

const heroServices = [
  'Construction & Infrastructure',
  'Aviation Ground Support Equipment',
  'Heavy Equipment & Machinery',
  'Industrial Manufacturing',
  'Custom Metal Fabrication',
  'Architectural & Interior Metalwork',
]

export function HomeBlockRenderer(props: { blocks: HomeLayout }) {
  const industriesBlock = props.blocks.find(
    (block): block is HomeIndustriesLayoutBlock => block.blockType === 'homeIndustries',
  )
  const processBlock = props.blocks.find(
    (block): block is HomeProcessLayoutBlock => block.blockType === 'homeProcess',
  )
  const heroRendersIndustries =
    props.blocks.some((block) => block.blockType === 'homeHero') && Boolean(industriesBlock)

  return (
    <>
      {props.blocks.map((block, index) =>
        renderHomeBlock(block, index, industriesBlock, processBlock, heroRendersIndustries),
      )}
    </>
  )
}

function renderHomeBlock(
  block: HomeLayout[number],
  index: number,
  industriesBlock: HomeIndustriesLayoutBlock | undefined,
  processBlock: HomeProcessLayoutBlock | undefined,
  heroRendersIndustries: boolean,
) {
  const key = `${block.blockType}-${block.id ?? index}`

  switch (block.blockType) {
    case 'homeHero':
      return (
        <HomeHero
          key={key}
          block={block}
          industriesBlock={industriesBlock}
          processBlock={processBlock}
        />
      )
    case 'homeIndustries':
      if (heroRendersIndustries && industriesBlock === block) {
        return null
      }

      return <HomeIndustries key={key} block={block} />
    case 'homeProcess':
      if (heroRendersIndustries && processBlock === block) return null
      return <HomeProcess key={key} block={block} />
    default:
      return null
  }
}

function HomeHero(props: {
  block: HomeHeroLayoutBlock
  industriesBlock?: HomeIndustriesLayoutBlock
  processBlock?: HomeProcessLayoutBlock
}) {
  const { block, industriesBlock, processBlock } = props

  return (
    <>
      <section
        aria-label="Sky Wings hero"
        className="hero-section hero-container"
        data-responsive-layout="hero"
        id="top"
      >
        <div className="hero-video-layer" aria-hidden="true">
          <picture className="hero-image">
            <source media="(min-width: 90rem)" srcSet="/images/home/hero-desktop.png" />
            <source media="(min-width: 48rem)" srcSet="/images/home/hero-laptop.png" />
            <img alt="" src="/images/home/hero-mobile.png" />
          </picture>
          <div className="hero-video-placeholder" />
        </div>

        <div className="hero-content-band">
          <div className="hero-content">
            <div className="hero-copy">
              <Eyebrow>{block.eyebrow}</Eyebrow>
              <h1>{block.heading}</h1>
            </div>

            <div className="hero-summary">
              <p className="hero-text">{optionalText(block.description)}</p>
              <div className="hero-actions">
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
              </div>
            </div>
          </div>

          <div className="hero-services-marquee" aria-label="Services carousel">
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
          </div>
        </div>
      </section>
      <HomeServicesScroller />
      {industriesBlock ? <HomeIndustriesAccordion block={industriesBlock} /> : null}
      {processBlock ? <HomeProcessSection block={processBlock} /> : null}
      {processBlock ? <HomeGlobeSection /> : null}
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
