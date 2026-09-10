import type { BlogPost } from '@/payload-types'
import { articleOutline, readingMinutes, type OutlineEntry } from '@/lib/articles/outline'

import { articleCategoryLabel, isArticleCategory, type ArticleCategory } from './articleCategories'
import { cachedQuery } from './cache'
import { getMediaImage } from './media'
import { getPayloadClient } from './payload'
import { TAGS } from './tags'

/*
 * The knowledge hub's reads. Articles live in the `blog-posts` collection;
 * everything the hub and an article page render is shaped here, so the
 * components never touch a Payload document.
 */

export type ArticleImage = { alt: string; url: string }

/** An article as a card: enough to list, filter and order it. */
export type ArticleCard = {
  category: ArticleCategory | null
  categoryLabel: string | null
  excerpt: string
  featured: boolean
  id: number
  image: ArticleImage | null
  /** ISO date; null for an article saved without one, which sorts last. */
  publishedAt: string | null
  readingMinutes: number
  slug: string
  title: string
}

export type ArticleByline = {
  avatar: ArticleImage | null
  name: string
  role: string | null
}

export type Article = ArticleCard & {
  byline: ArticleByline
  content: BlogPost['content']
  outline: OutlineEntry[]
  seo: BlogPost['seo']
  updatedAt: string
}

/** Who an article is credited to when its byline is left empty. */
export const DEFAULT_BYLINE: ArticleByline = {
  avatar: null,
  name: 'Sky Wings Engineering',
  role: 'Fabrication & machining team',
}

function image(value: unknown): ArticleImage | null {
  const media = getMediaImage(value)
  return media ? { alt: media.alt, url: media.url } : null
}

function toCard(post: BlogPost): ArticleCard {
  const category = isArticleCategory(post.category) ? post.category : null

  return {
    category,
    categoryLabel: articleCategoryLabel(category),
    excerpt: post.excerpt,
    featured: Boolean(post.featured),
    id: post.id,
    image: image(post.featuredImage),
    publishedAt: post.publishedAt ?? null,
    readingMinutes: readingMinutes(post.content),
    slug: post.slug,
    title: post.title,
  }
}

function toArticle(post: BlogPost): Article {
  const name = post.byline?.name?.trim()

  return {
    ...toCard(post),
    byline: name
      ? { avatar: image(post.byline?.avatar), name, role: post.byline?.role?.trim() || null }
      : DEFAULT_BYLINE,
    content: post.content,
    outline: articleOutline(post.content),
    seo: post.seo,
    updatedAt: post.updatedAt,
  }
}

/** Newest first; an article with no date goes to the end. */
export function byPublished(
  a: Pick<ArticleCard, 'publishedAt'>,
  b: Pick<ArticleCard, 'publishedAt'>,
) {
  return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
}

export const getArticleCards = cachedQuery(
  async function fetchArticleCards(): Promise<ArticleCard[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'blog-posts',
      depth: 1,
      draft: false,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      // The content comes back for the reading time; the SEO group does not.
      select: { seo: false, tags: false },
      sort: '-publishedAt',
    })

    return docs.map(toCard).sort(byPublished)
  },
  ['article-cards-v2'],
  [TAGS.blog, TAGS.media],
)

async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blog-posts',
    // Depth 2 so images placed in the content arrive with their files.
    depth: 2,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })

  return docs[0] ? toArticle(docs[0]) : null
}

export function getArticleBySlug(slug: string): Promise<Article | null> {
  return cachedQuery(
    fetchArticleBySlug,
    ['article-by-slug-v2', slug],
    [TAGS.blog, TAGS.post(slug), TAGS.media],
  )(slug)
}
