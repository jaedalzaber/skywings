import type { Page } from '@/payload-types'

import { cachedQuery } from './cache'
import { getPayloadClient } from './payload'
import { TAGS } from './tags'

export type PageLayout = NonNullable<Page['layout']>
export type PageLayoutBlock = PageLayout[number]

const pageLayoutWithoutHomeServicesSelect = {
  layout: {
    homeServices: false,
  },
} as const

async function fetchPageLayoutBySlug(slug: string): Promise<PageLayout | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    select: pageLayoutWithoutHomeServicesSelect,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return docs[0]?.layout?.length ? docs[0].layout : null
}

export async function getPageLayout(slug: string, fallbackLayout: PageLayout): Promise<PageLayout> {
  try {
    const layout = await cachedQuery(
      fetchPageLayoutBySlug,
      ['page-layout', slug],
      [TAGS.pages, TAGS.page(slug), TAGS.media],
    )(slug)

    return layout ?? fallbackLayout
  } catch (error) {
    console.error(`Unable to load Payload page layout for ${slug}`, error)

    return fallbackLayout
  }
}
