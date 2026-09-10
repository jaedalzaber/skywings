import { Suspense } from 'react'

import { ProductCatalog } from '@/components/collections/catalog/ProductCatalog'
import { getCatalogView } from '@/data/catalog'

/**
 * The catalogue. Every product is sent once and filtered in the browser, so
 * the page has no reason to be rendered per request -- the header's Products
 * menu deep-links into a family with a query string, and the catalogue picks
 * that up on the client rather than here, which is what keeps this route
 * cacheable.
 */
export default async function ProductsPage() {
  const { categories, products } = await getCatalogView()

  return (
    // useSearchParams reads the menu's deep link on the client, which needs a
    // boundary for the static shell to render past.
    <Suspense fallback={null}>
      <ProductCatalog
        categories={categories}
        products={products}
        selection={{ family: null, industry: null }}
      />
    </Suspense>
  )
}
