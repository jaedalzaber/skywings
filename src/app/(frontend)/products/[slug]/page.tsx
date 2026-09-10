import { notFound } from 'next/navigation'

import { ProductCatalog } from '@/components/collections/catalog/ProductCatalog'
import { ProductDetail } from '@/components/collections/product/ProductDetail'
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import {
  getAllProductSlugs,
  getCatalogView,
  getProductBySlug,
  getRelatedProductsFor,
  type CatalogView,
} from '@/data/catalog'

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()

  return slugs.map((slug) => ({ slug }))
}

/**
 * A category filed under this slug, if there is one: an industry group in the
 * sidebar, or one of the families inside it.
 */
function findCategory(view: CatalogView, slug: string) {
  const industry = view.categories.find((category) => category.slug === slug)
  if (industry) return { family: null, industry: industry.slug }

  for (const category of view.categories) {
    if (category.children.some((child) => child.slug === slug)) {
      return { family: slug, industry: category.slug }
    }
  }

  return null
}

/**
 * One slug, two kinds of page: a product, or the catalogue narrowed to a
 * category. Products are resolved first, because every card, menu and sitemap
 * on the site already points here for them -- a category only answers a slug
 * no product claims.
 */
export default async function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const product = await getProductBySlug(slug)

  if (!product) {
    const view = await getCatalogView()
    const selection = findCategory(view, slug)

    if (!selection) {
      notFound()
    }

    return (
      <ProductCatalog
        categories={view.categories}
        products={view.products}
        selection={selection}
      />
    )
  }

  const related = await getRelatedProductsFor(product)

  return (
    <>
      <ProductDetail product={product} related={related} />
      {product.layout?.length ? <PageBlocks blocks={product.layout} /> : null}
    </>
  )
}
