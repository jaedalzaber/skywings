import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { productsLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export default async function ProductsPage() {
  const layout = await getPageLayout('products', productsLayout)

  return <PageBlocks blocks={layout} />
}
