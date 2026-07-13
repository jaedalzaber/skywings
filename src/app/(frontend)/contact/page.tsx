import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { contactLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'
import { hasSubmitted, type RouteSearchParams } from '@/data/searchParams'

export const dynamic = 'force-dynamic'

export default async function ContactPage(props: { searchParams: RouteSearchParams }) {
  const [layout, submitted] = await Promise.all([
    getPageLayout('contact', contactLayout),
    hasSubmitted(props.searchParams),
  ])

  return <PageBlocks blocks={layout} submitted={submitted} />
}
