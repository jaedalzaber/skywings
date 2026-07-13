import { ButtonLink } from '@/components/atoms/ButtonLink'
import { Eyebrow } from '@/components/atoms/Eyebrow'
import { NumberLabel } from '@/components/atoms/NumberLabel'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import {
  type HomeCapabilitiesLayoutBlock,
  type HomeConfiguratorLayoutBlock,
  type HomeHeroLayoutBlock,
  type HomeIndustriesLayoutBlock,
  type HomeLayout,
  type HomeProcessLayoutBlock,
  type HomeProductMapLayoutBlock,
} from '@/data/home'

import { HomeIndustriesAccordion } from './HomeIndustriesAccordion'
import { HomeGlobeSection } from './HomeGlobeSection'
import { HomeProcessSection } from './HomeProcessSection'
import { HomeServicesScroller } from './HomeServicesScroller'
import { ConfiguratorWireframe, ProductWireframe } from './HomeWireframes'

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

  return <>{props.blocks.map((block, index) => renderHomeBlock(block, index, industriesBlock, processBlock, heroRendersIndustries))}</>
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
      return <HomeHero key={key} block={block} industriesBlock={industriesBlock} processBlock={processBlock} />
    case 'homeCapabilities':
      return <HomeCapabilities key={key} block={block} />
    case 'homeIndustries':
      if (heroRendersIndustries && industriesBlock === block) {
        return null
      }

      return <HomeIndustries key={key} block={block} />
    case 'homeProductMap':
      return <HomeProductMap key={key} block={block} />
    case 'homeProcess':
      if (heroRendersIndustries && processBlock === block) return null
      return <HomeProcess key={key} block={block} />
    case 'homeConfigurator':
      return <HomeConfigurator key={key} block={block} />
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
      <section className="hero-section hero-container" id="top" aria-label="Sky Wings hero">
        <div className="hero-video-layer" aria-hidden="true">
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

function HomeCapabilities(props: { block: HomeCapabilitiesLayoutBlock }) {
  const { block } = props

  return (
    <section className="section-block" id="capabilities">
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} />
      <div className="capability-grid">
        {block.items.map((item, itemIndex) => (
          <article className="system-card" key={item.id ?? item.title}>
            <NumberLabel value={itemIndex + 1} />
            <h3>{item.title}</h3>
            <p>{optionalText(item.description)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HomeIndustries(props: { block: HomeIndustriesLayoutBlock }) {
  const { block } = props

  return <HomeIndustriesAccordion block={block} />
}

function HomeProductMap(props: { block: HomeProductMapLayoutBlock }) {
  const { block } = props

  return (
    <section className="section-block muted-band" id="products">
      <SectionHeading eyebrow={block.eyebrow} heading={block.heading} wide />
      <div className="product-map">
        {block.items.map((product, itemIndex) => (
          <article className="product-card" key={product.id ?? product.title}>
            <ProductWireframe />
            <NumberLabel value={itemIndex + 1} />
            <h3>{product.title}</h3>
            <p>{optionalText(product.description)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HomeProcess(props: { block: HomeProcessLayoutBlock }) {
  return <HomeProcessSection block={props.block} />
}

function HomeConfigurator(props: { block: HomeConfiguratorLayoutBlock }) {
  const { block } = props

  return (
    <section className="rfq-section" id="rfq">
      <ConfiguratorWireframe />
      <div className="rfq-copy">
        <Eyebrow>{block.eyebrow}</Eyebrow>
        <h2>{block.heading}</h2>
        <p>{optionalText(block.description)}</p>
        {block.ctaLabel && block.ctaHref ? (
          <ButtonLink href={block.ctaHref} variant="primary">
            {block.ctaLabel}
          </ButtonLink>
        ) : null}
      </div>
    </section>
  )
}
