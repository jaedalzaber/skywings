/**
 * Writes the knowledge hub's first articles (src/data/articleSeeds.ts) into
 * the Articles collection, published.
 *
 * Matched on slug. An article that already exists is left alone -- once
 * seeded it belongs to the editors -- unless FORCE=1, which overwrites it with
 * the committed text. Pictures are looked up in the media library by file
 * name; a missing one stops the run rather than seeding an article without it.
 *
 *   pnpm seed:articles            (DRY_RUN=1 to preview, FORCE=1 to overwrite)
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import { ARTICLE_MEDIA, articleSeeds, type ArticleMediaKey } from '../src/data/articleSeeds'
import { markdownToLexical } from '../src/lib/articles/markdown'

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const force = process.env.FORCE === '1' || process.env.FORCE === 'true'

const payload = await getPayload({ config })

// Media ids by key, from the file names the articles name.
const mediaIds = new Map<ArticleMediaKey, number>()
for (const [key, filename] of Object.entries(ARTICLE_MEDIA) as [ArticleMediaKey, string][]) {
  const { docs } = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    where: { filename: { equals: filename } },
  })
  const id = (docs[0] as { id: number } | undefined)?.id
  if (!id) throw new Error(`No media file named "${filename}" (${key}).`)
  mediaIds.set(key, id)
}

let created = 0
let updated = 0
let kept = 0

for (const seed of articleSeeds) {
  const body = seed.body.replace(/\{\{(\w+)\}\}/g, (_, key: ArticleMediaKey) => {
    const id = mediaIds.get(key)
    if (!id) throw new Error(`${seed.slug}: unknown picture key "${key}".`)
    return `media:${id}`
  })

  const data = {
    _status: 'published' as const,
    category: seed.category,
    content: markdownToLexical(body),
    excerpt: seed.excerpt,
    featured: Boolean(seed.featured),
    featuredImage: mediaIds.get(seed.image),
    publishedAt: seed.publishedAt,
    slug: seed.slug,
    title: seed.title,
  }

  const { docs } = await payload.find({
    collection: 'blog-posts',
    depth: 0,
    draft: true,
    limit: 1,
    where: { slug: { equals: seed.slug } },
  })
  const existing = docs[0] as { id: number } | undefined

  if (existing && !force) {
    kept += 1
    console.log('kept (already exists):', seed.slug)
    continue
  }

  if (dryRun) {
    console.log(existing ? 'would overwrite:' : 'would create:', seed.slug, `(${seed.category})`)
    if (existing) updated += 1
    else created += 1
    continue
  }

  if (existing) {
    // Typed loosely: the rich text is built, not typed against the generated union.
    await payload.update({ collection: 'blog-posts', data: data as never, id: existing.id })
    updated += 1
    console.log('overwritten:', seed.slug)
  } else {
    await payload.create({ collection: 'blog-posts', data: data as never })
    created += 1
    console.log('created:', seed.slug)
  }
}

console.log(
  `\n${dryRun ? 'DRY RUN, nothing written -- ' : ''}created ${created} | overwritten ${updated} | kept ${kept}`,
)

process.exit(0)
