import Link from 'next/link'

import { ProductImage } from '@/components/atoms/ProductImage'

export type ProductLite = {
  id: number
  image: { alt: string; url: string } | null
  industrySlugs: string[]
  number: number
  sku: string
  slug: string
  summary: string
  title: string
}

export function ProductShopCard(props: { product: ProductLite }) {
  const { product } = props

  return (
    <article className="pcat-card">
      <Link className="pcat-card-link" href={`/products/${product.slug}`}>
        <span className="pcat-card-number">{String(product.number).padStart(2, '0')}</span>
        <h3 className="pcat-card-title">{product.title}</h3>
        <div className="pcat-card-media">
          <ProductImage
            alt={product.image?.alt ?? `${product.title} product image`}
            sizes="(min-width: 64rem) 12rem, (min-width: 40rem) 30vw, 45vw"
            url={product.image?.url ?? null}
          />
        </div>
        {product.summary ? <p className="pcat-card-desc">{product.summary}</p> : null}
        {product.sku ? <span className="pcat-card-sku">{product.sku}</span> : null}
      </Link>
    </article>
  )
}
