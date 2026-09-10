import { notFound, redirect } from 'next/navigation'

import { ProductCatalog } from '@/components/collections/catalog/ProductCatalog'
import { ProductDetail } from '@/components/collections/product/ProductDetail'
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import {
  getCatalogView,
  getProductBySlug,
  getRelatedProductsFor,
  type CatalogView,
} from '@/data/catalog'
import { catalogHref, pageRedirect, parseCatalogQuery, queryCatalog } from '@/data/catalogQuery'
import { hasProductPage } from '@/data/productReadiness'
import { relationSlug } from '@/data/relations'
import type { RouteSearchParams } from '@/data/searchParams'

/*
 * Rendered per request, as /products is. A category page reads the query
 * string -- search, sort, page -- and a route that is prerendered cannot: in
 * production Next refuses the read with DYNAMIC_SERVER_USAGE, so while
 * generateStaticParams prerendered the product pages, every category page
 * (/products/aviation-ground-support-equipment and the rest) returned a 500.
 * Dev mode never showed it. Product pages lose little: their data comes from
 * the cached reads either way.
 */
export const dynamic = 'force-dynamic'

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
 * category. A finished product is resolved first, because every card, menu
 * and sitemap on the site already points here for it -- a category answers a
 * slug no finished product claims.
 *
 * A product whose page is not written yet has nothing to show here but its
 * name. No card links to it, and an address that reaches it anyway -- an old
 * link, a guess -- goes on to its shelf in the catalogue, where it is shown.
 * The redirect is temporary, so the page is picked up the day it is finished.
 * It gives way to a category of the same name rather than shadowing it: the
 * "ULD Containers" range product and the ULD Containers family share a slug,
 * and redirecting one to the other would send the address to itself.
 *
 * The query string is read only on the category branch: a product page has
 * no use for it.
 */
export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string }>
  searchParams: RouteSearchParams
}) {
  const { slug } = await props.params
  const product = await getProductBySlug(slug)

  if (product && hasProductPage(product)) {
    const related = await getRelatedProductsFor(product)

    return (
      <>
        <ProductDetail product={product} related={related} />
        {product.layout?.length ? <PageBlocks blocks={product.layout} /> : null}
      </>
    )
  }

  const view = await getCatalogView()
  const selection = findCategory(view, slug)

  if (!selection) {
    if (product) {
      const family = relationSlug(product.productFamily)
      redirect(family && family !== slug ? `/products/${family}` : '/products')
    }

    notFound()
  }

  const basePath = `/products/${slug}`
  const params = await props.searchParams
  const query = parseCatalogQuery(params, selection)
  const result = queryCatalog(view.products, query)
  const target = pageRedirect(
    params.page,
    result.page,
    catalogHref(basePath, { ...query, page: result.page }, { pathSelection: true }),
  )
  if (target) redirect(target)

  return (
    <ProductCatalog
      basePath={basePath}
      categories={view.categories}
      pathSelection
      query={query}
      result={result}
      totalProducts={view.products.length}
    />
  )
}
