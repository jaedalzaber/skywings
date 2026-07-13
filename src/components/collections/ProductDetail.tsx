import Image from 'next/image'

import { ButtonLink } from '@/components/atoms/ButtonLink'
import { MediaWireframe } from '@/components/atoms/MediaWireframe'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import { RFQForm } from '@/components/forms/RFQForm'
import type { Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'
import { relationArray, relationTitle } from '@/data/relations'

export function ProductDetail(props: { product: Product }) {
  const { product } = props
  const image = getMediaImage(product.featuredImage)

  return (
    <>
      <section className="product-detail-hero">
        <div>
          <span className="wire-label">{product.sku || product.productType || 'product'}</span>
          <h1>{product.title}</h1>
          <p className="hero-text">{product.summary}</p>
          <div className="hero-actions">
            <ButtonLink href="#rfq-form">Request quote</ButtonLink>
            <ButtonLink href="/products" variant="secondary">
              Back to products
            </ButtonLink>
          </div>
        </div>
        <div className="product-detail-media">
          {image ? (
            <Image
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 64rem) 50vw, 100vw"
              src={image.url}
            />
          ) : (
            <MediaWireframe label={product.isConfigurable ? '3D configurable' : 'product visual'} />
          )}
        </div>
      </section>

      <section className="split-section">
        <SectionHeading
          description="Core product fields are managed in Payload and can later connect to true 3D viewers/configurators."
          eyebrow="Product data"
          heading="Specifications and manufacturing context."
          sticky
        />
        <div className="detail-panel">
          <dl className="spec-grid">
            <div>
              <dt>Family</dt>
              <dd>{relationTitle(product.productFamily)}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{product.productType || 'standard'}</dd>
            </div>
            <div>
              <dt>Load capacity</dt>
              <dd>{product.loadCapacity || 'By requirement'}</dd>
            </div>
            <div>
              <dt>Surface treatment</dt>
              <dd>{product.surfaceTreatment || 'Project specific'}</dd>
            </div>
          </dl>
          {product.specifications?.length ? (
            <div className="spec-table">
              {product.specifications.map((spec) => (
                <div key={spec.id ?? spec.label}>
                  <span>{spec.label}</span>
                  <strong>
                    {spec.value}
                    {spec.unit ? ` ${spec.unit}` : ''}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
          {product.configurationOptions?.length ? (
            <div className="option-groups">
              {product.configurationOptions.map((group) => (
                <article key={group.id ?? group.group}>
                  <h3>{group.group}</h3>
                  <p>
                    {group.options?.map((option) => option.label).join(', ') ||
                      'Options managed in Payload'}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block muted-band">
        <SectionHeading
          description="Relationship fields keep each product connected to the broader manufacturing system."
          eyebrow="Related"
          heading="Industries, capabilities, brochures, and future case studies."
          wide
        />
        <div className="relationship-grid">
          {[
            ['Industries', relationArray(product.industries).map((item) => relationTitle(item))],
            [
              'Capabilities',
              relationArray(product.capabilities).map((item) => relationTitle(item)),
            ],
            ['Materials', relationArray(product.materials).map((item) => relationTitle(item))],
            ['Finishes', relationArray(product.finishes).map((item) => relationTitle(item))],
          ].map(([label, items]) => (
            <article className="system-card" key={label as string}>
              <h3>{label as string}</h3>
              <p>{(items as string[]).join(', ') || 'Managed in Payload'}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rfq-section">
        <div className="rfq-copy">
          <SectionHeading
            description="Use this as the first step toward a product-specific configurator and RFQ flow."
            eyebrow="RFQ"
            heading="Ask for this product or a custom variation."
            wide
          />
        </div>
        <RFQForm productInterest={product.title} sourcePage={`/products/${product.slug}`} />
      </section>
    </>
  )
}
