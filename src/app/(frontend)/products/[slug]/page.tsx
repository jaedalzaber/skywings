import { notFound } from 'next/navigation'

import { ProductDetail } from '@/components/collections/ProductDetail'
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { getProductBySlug } from '@/data/catalog'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <>
      <ProductDetail product={product} />
      {product.layout?.length ? <PageBlocks blocks={product.layout} /> : null}
    </>
  )
}
