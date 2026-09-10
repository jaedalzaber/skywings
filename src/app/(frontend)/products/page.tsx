import { redirect } from 'next/navigation'

import { ProductCatalog } from '@/components/collections/catalog/ProductCatalog'
import { getCatalogView } from '@/data/catalog'
import { catalogHref, pageRedirect, parseCatalogQuery, queryCatalog } from '@/data/catalogQuery'
import type { RouteSearchParams } from '@/data/searchParams'

/**
 * The catalogue, one page at a time.
 *
 * Category, search, sort and page all live in the query string, and the page
 * is rendered here for exactly what it names -- so the HTML carries the
 * products and real links to the next page, and a reload, a shared link or
 * Back lands where the visitor was. The products themselves come from one
 * cached read of the collection (getCatalogView), invalidated whenever a
 * product, industry or image is saved in the admin.
 */
export default async function ProductsPage(props: { searchParams: RouteSearchParams }) {
  const [view, params] = await Promise.all([getCatalogView(), props.searchParams])
  const query = parseCatalogQuery(params)
  const result = queryCatalog(view.products, query)

  const target = pageRedirect(
    params.page,
    result.page,
    catalogHref('/products', { ...query, page: result.page }),
  )
  if (target) redirect(target)

  return (
    <ProductCatalog
      basePath="/products"
      categories={view.categories}
      query={query}
      result={result}
      totalProducts={view.products.length}
    />
  )
}
