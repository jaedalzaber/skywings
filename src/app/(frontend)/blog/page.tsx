import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { blogLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const layout = await getPageLayout('blog', blogLayout)

  return <PageBlocks blocks={layout} />
}
