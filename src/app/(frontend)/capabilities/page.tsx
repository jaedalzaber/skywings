import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { capabilitiesLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export const dynamic = 'force-dynamic'

export default async function CapabilitiesPage() {
  const layout = await getPageLayout('capabilities', capabilitiesLayout)

  return <PageBlocks blocks={layout} />
}
