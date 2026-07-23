import { notFound } from 'next/navigation'

import { ProductDetail } from '@/components/collections/product/ProductDetail'
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { getAllProductSlugs, getProductBySlug, getRelatedProductsFor } from '@/data/catalog'

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()

  return slugs.map((slug) => ({ slug }))
}

export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const related = await getRelatedProductsFor(product)

  return (
    <>
      <ProductDetail product={product} related={related} />
      {product.layout?.length ? <PageBlocks blocks={product.layout} /> : null}
    </>
  )
}
