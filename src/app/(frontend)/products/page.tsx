import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { productsLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'
import { getProductFilters, type RouteSearchParams } from '@/data/searchParams'

export const dynamic = 'force-dynamic'

export default async function ProductsPage(props: { searchParams: RouteSearchParams }) {
  const [filters, layout] = await Promise.all([
    getProductFilters(props.searchParams),
    getPageLayout('products', productsLayout),
  ])

  return <PageBlocks blocks={layout} filters={filters} />
}
