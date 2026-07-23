import Link from 'next/link'

import { ButtonLink } from '@/components/atoms/ButtonLink'
import { MediaWireframe } from '@/components/atoms/MediaWireframe'
import { NumberLabel } from '@/components/atoms/NumberLabel'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { BlogPost, Brochure, Capability, Industry, Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'
import { relationTitle } from '@/data/relations'

export function ProductCard(props: { index: number; product: Product }) {
  const { index, product } = props
  const image = getMediaImage(product.featuredImage)

  return (
    <article className="catalog-card product-shop-card">
      <Link className="catalog-card-link product-shop-card-link" href={`/products/${product.slug}`}>
        <span className="shop-index">{String(index + 1).padStart(2, '0')}</span>
        <h3>{product.title}</h3>
        <div className="shop-product-media">
          {image ? (
            <Image alt={image.alt} fill sizes="(min-width: 64rem) 25vw, 50vw" src={image.url} />
          ) : (
            <MediaWireframe label={product.productType || 'product'} />
          )}
        </div>
        <p>{product.summary}</p>
        <div className="shop-card-footer">
          <strong>{product.sku || 'TBD'}</strong>
          <span>{relationTitle(product.productFamily)}</span>
        </div>
      </Link>
    </article>
  )
}

export function CapabilityCard(props: { capability: Capability; index: number }) {
  const { capability, index } = props
  const image = getMediaImage(capability.featuredImage)

  return (
    <article className="catalog-card">
      <div className="catalog-media">
        {image ? (
          <Image alt={image.alt} fill sizes="(min-width: 64rem) 33vw, 50vw" src={image.url} />
        ) : (
          <MediaWireframe label={capability.processType} />
        )}
      </div>
      <NumberLabel value={index + 1} />
      <h3>{capability.title}</h3>
      <p>{capability.summary}</p>
      <dl className="meta-list">
        <div>
          <dt>Process</dt>
          <dd>{capability.processType}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{capability.capacityNotes || 'Editor managed'}</dd>
        </div>
      </dl>
    </article>
  )
}

export function IndustryCard(props: { industry: Industry; index: number }) {
  const { industry, index } = props
  const image = getMediaImage(industry.heroImage)

  return (
    <article className="catalog-card">
      <div className="catalog-media">
        {image ? (
          <Image alt={image.alt} fill sizes="(min-width: 64rem) 33vw, 50vw" src={image.url} />
        ) : (
          <MediaWireframe label="industry" />
        )}
      </div>
      <NumberLabel value={index + 1} />
      <h3>{industry.title}</h3>
      <p>{industry.summary}</p>
      <ButtonLink href={`/products?industry=${industry.slug}`} variant="secondary">
        View products
      </ButtonLink>
    </article>
  )
}

export function BrochureCard(props: { brochure: Brochure; index: number }) {
  const { brochure, index } = props
  const image = getMediaImage(brochure.coverImage)

  return (
    <article className="catalog-card brochure-card">
      <div className="catalog-media brochure-cover">
        {image ? (
          <Image alt={image.alt} fill sizes="(min-width: 64rem) 33vw, 50vw" src={image.url} />
        ) : (
          <MediaWireframe label={brochure.brochureType || 'pdf'} />
        )}
      </div>
      <NumberLabel value={index + 1} />
      <h3>{brochure.title}</h3>
      <p>{brochure.summary || 'PDF brochure managed in Payload.'}</p>
      <dl className="meta-list">
        <div>
          <dt>Type</dt>
          <dd>{brochure.brochureType || 'brochure'}</dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd>{brochure.requiresLeadCapture ? 'Lead gated' : 'Public'}</dd>
        </div>
      </dl>
      {brochure.url ? (
        <ButtonLink href={brochure.url} openInNewTab variant="primary">
          Download
        </ButtonLink>
      ) : null}
    </article>
  )
}

export function BlogCard(props: { post: BlogPost }) {
  const { post } = props

  return (
    <article className="list-article">
      <Link href={`/blog/${post.slug}`}>
        <span className="wire-label">
          {post.publishedAt
            ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                new Date(post.publishedAt),
              )
            : 'Draft date'}
        </span>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
      </Link>
    </article>
  )
}
