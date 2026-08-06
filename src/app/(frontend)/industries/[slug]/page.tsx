import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { IndustryBlocks } from '@/components/industry/IndustryBlocks'
import { getIndustryPage, getIndustryPageSlugs, visibleBlocks } from '@/data/industryPages'
import { getMediaImage } from '@/data/media'

type IndustryRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getIndustryPageSlugs()

  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(props: IndustryRouteProps): Promise<Metadata> {
  const { slug } = await props.params
  const page = await getIndustryPage(slug)

  if (!page) {
    return {}
  }

  const ogImage = getMediaImage(page.seo?.image)

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description ?? undefined,
    robots: page.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.seo?.title || page.title,
      description: page.seo?.description ?? undefined,
      images: ogImage ? [{ url: ogImage.url, alt: ogImage.alt }] : undefined,
      type: 'website',
    },
  }
}

export default async function IndustryPageRoute(props: IndustryRouteProps) {
  const { slug } = await props.params
  const page = await getIndustryPage(slug)

  if (!page) {
    notFound()
  }

  return <IndustryBlocks blocks={visibleBlocks(page.layout)} />
}
