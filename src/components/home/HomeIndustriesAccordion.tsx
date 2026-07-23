import type { CSSProperties } from 'react'

import type { HomeIndustriesLayoutBlock, HomeIndustryItem } from '@/data/home'

import { IndustryHeroMedia } from './IndustryHeroMedia'
import { IndustryProductRail } from './IndustryProductRail'

const industryProducts = [
  'Brackets and support structures',
  'Brackets and support structures',
  'Brackets and support structures',
]

function IndustrySummary() {
  return (
    <p>
      Sky Wings turns sector-specific <strong>requirements</strong> into engineered metal products,
      assemblies, and fabricated structures with one team accountable from planning to delivery.
    </p>
  )
}

function IndustryCardSummary(props: { industry: HomeIndustryItem }) {
  const { industry } = props

  if (industry.summary) {
    return <p>{industry.summary}</p>
  }

  return <IndustrySummary />
}

export function HomeIndustriesAccordion(props: { block: HomeIndustriesLayoutBlock }) {
  const { block } = props
  const sectionStyle = {
    '--industries-count': block.items.length,
  } as CSSProperties

  return (
    <section
      className="industries-showcase"
      id="industries"
      aria-labelledby="industries-showcase-title"
      data-responsive-layout="industries"
      style={sectionStyle}
    >
      <div className="industries-showcase-intro">
        <p className="industries-showcase-eyebrow">{block.eyebrow}</p>
        <h2 id="industries-showcase-title">{block.heading}</h2>
      </div>

      <div className="industries-showcase-stack">
        {block.items.map((industry, itemIndex) => {
          const style = {
            '--industry-index': itemIndex,
          } as CSSProperties
          const productCards =
            industry.products && industry.products.length
              ? industry.products
              : industryProducts.map((title, index) => ({
                  id: `${industry.title}-${index}`,
                  image: null,
                  slug: '',
                  summary: '',
                  title,
                }))
          const ctaHref = industry.ctaHref || '#products'

          return (
            <div className="industries-showcase-card-stage" key={industry.id ?? industry.title}>
              <article className="industries-showcase-card" style={style}>
                <div className="industries-showcase-card-inner">
                  <p className="industries-showcase-card-code">
                    {String(itemIndex + 1).padStart(2, '0')}
                  </p>

                  <div className="industries-showcase-card-body">
                    <h3 className="industries-showcase-card-title">{industry.title}</h3>
                    <IndustryHeroMedia
                      className="industries-showcase-card-media--compact"
                      image={industry.heroImage}
                    />
                    <div className="industries-showcase-card-summary">
                      <IndustryCardSummary industry={industry} />
                    </div>
                  </div>

                  <IndustryProductRail
                    anchorId={itemIndex === 0 ? 'products' : undefined}
                    ctaHref={ctaHref}
                    products={productCards}
                  />

                  <a className="industries-showcase-cta" href={ctaHref}>
                    Browse Related Products
                  </a>
                </div>

                <IndustryHeroMedia
                  className="industries-showcase-card-media--wide"
                  image={industry.heroImage}
                />
              </article>
            </div>
          )
        })}
      </div>
    </section>
  )
}
