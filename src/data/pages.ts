import type { Page } from '@/payload-types'

import { getPayloadClient } from './payload'

export type PageLayout = NonNullable<Page['layout']>
export type PageLayoutBlock = PageLayout[number]

export async function getPageLayout(slug: string, fallbackLayout: PageLayout): Promise<PageLayout> {
  try {
    const payload = await getPayloadClient()

    const { docs } = await payload.find({
      collection: 'pages',
      depth: 1,
      draft: false,
      limit: 1,
      overrideAccess: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return docs[0]?.layout?.length ? docs[0].layout : fallbackLayout
  } catch (error) {
    console.error(`Unable to load Payload page layout for ${slug}`, error)

    return fallbackLayout
  }
}
