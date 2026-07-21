import Image from 'next/image'
import type { CSSProperties } from 'react'

import type { HomeIndustriesLayoutBlock } from '@/data/home'

const industryProductImage = '/images/industries/product-placeholder.png'

const industryProducts = [
  'Brackets and support structures',
  'Brackets and support structures',
  'Brackets and support structures',
]

function IndustrySummary() {
  return (
    <p>
      Sky Wings provides <strong>End-to-End Metal Manufacturing</strong>. We take a{' '}
      <strong>requirement</strong> - a drawing, a sample, a concept, or a problem to solve - and
      convert it into a <strong>manufactured product</strong>.
    </p>
  )
}

export function HomeIndustriesAccordion(props: { block: HomeIndustriesLayoutBlock }) {
  const { block } = props

  return (
    <section
      className="industries-showcase"
      id="industries"
      aria-labelledby="industries-showcase-title"
      data-responsive-layout="industries"
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

          return (
            <article
              className="industries-showcase-card"
              key={industry.id ?? industry.title}
              style={style}
            >
              <div className="industries-showcase-card-inner">
                <p className="industries-showcase-card-code">
                  I/{String(itemIndex + 1).padStart(3, '0')}
                </p>

                <div className="industries-showcase-card-body">
                  <h3 className="industries-showcase-card-title">{industry.title}</h3>
                  <div className="industries-showcase-card-summary">
                    <IndustrySummary />
                  </div>
                </div>

                <div
                  className="industries-showcase-product-grid"
                  id={itemIndex === 0 ? 'products' : undefined}
                >
                  {industryProducts.map((productTitle, productIndex) => (
                    <figure
                      className="industries-showcase-product-card"
                      key={`${industry.title}-${productIndex}`}
                    >
                      <div className="industries-showcase-product-frame">
                        <Image
                          alt=""
                          className="industries-showcase-product-image"
                          fill
                          loading="lazy"
                          sizes="(max-width: 767px) 42vw, (max-width: 1439px) 18vw, 16vw"
                          src={industryProductImage}
                        />
                      </div>
                      <figcaption>{productTitle}</figcaption>
                    </figure>
                  ))}
                </div>

                <a className="industries-showcase-cta" href="#products">
                  Browse Related Products
                </a>
              </div>

              <div className="industries-showcase-card-media" aria-hidden="true" />
            </article>
          )
        })}
      </div>
    </section>
  )
}
