import type { IndustryPage } from '@/payload-types'

import { cachedQuery } from './cache'
import { getPayloadClient } from './payload'
import { TAGS } from './tags'

export type IndustryPageLayout = NonNullable<IndustryPage['layout']>
export type IndustryPageBlock = IndustryPageLayout[number]

async function fetchIndustryPageBySlug(slug: string): Promise<IndustryPage | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'industry-pages',
    // Depth 2 so an upload nested inside a block array (card images, client
    // logos) arrives populated, and gallery entries carry their product.
    depth: 2,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: { equals: slug },
    },
  })

  return docs[0] ?? null
}

export async function getIndustryPage(slug: string): Promise<IndustryPage | null> {
  try {
    return await cachedQuery(
      fetchIndustryPageBySlug,
      ['industry-page', slug],
      [TAGS.industryPages, TAGS.industryPage(slug), TAGS.media, TAGS.products],
    )(slug)
  } catch (error) {
    console.error(`Unable to load industry page "${slug}"`, error)

    return null
  }
}

async function fetchIndustryPageSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'industry-pages',
    depth: 0,
    draft: false,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder',
  })

  return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

export async function getIndustryPageSlugs(): Promise<string[]> {
  try {
    return await cachedQuery(
      fetchIndustryPageSlugs,
      ['industry-page-slugs'],
      [TAGS.industryPages],
    )()
  } catch (error) {
    console.error('Unable to load industry page slugs', error)

    return []
  }
}

/**
 * Sections an editor has hidden never reach the renderer, so a hidden block
 * cannot leak markup, spacing or a stray heading into the page.
 */
export function visibleBlocks(layout: IndustryPageLayout | null | undefined): IndustryPageLayout {
  return (layout ?? []).filter((block) => !('hidden' in block && block.hidden))
}
