import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { getPageLayout } from '@/data/pages'
import { industriesLayout } from '@/data/pageDefaults'

export const dynamic = 'force-dynamic'

export default async function IndustriesPage() {
  const layout = await getPageLayout('industries', industriesLayout)

  return <PageBlocks blocks={layout} />
}
