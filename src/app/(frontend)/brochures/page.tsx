import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { brochuresLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export const dynamic = 'force-dynamic'

export default async function BrochuresPage() {
  const layout = await getPageLayout('brochures', brochuresLayout)

  return <PageBlocks blocks={layout} />
}
