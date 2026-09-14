import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { ArticlePage } from '@/components/resources/ArticlePage'
import { ResourcesHub } from '@/components/resources/ResourcesHub'
import {
  ARTICLES_PAGE_SIZE,
  articlesHref,
  parseArticleQuery,
  queryArticles,
  relatedArticles,
} from '@/data/articleQuery'
import { ARTICLE_MEDIA, articleSeeds } from '@/data/articleSeeds'
import { DEFAULT_BYLINE, type Article, type ArticleCard } from '@/data/articles'
import { defaultHeaderData } from '@/data/site'
import { markdownToLexical, parseInline } from '@/lib/articles/markdown'
import { articleOutline, headingIds, headingSlug, readingMinutes } from '@/lib/articles/outline'
import type { BlogPost } from '@/payload-types'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const card = (id: number, over: Partial<ArticleCard> = {}): ArticleCard => ({
  category: 'guides',
  categoryLabel: 'Guides',
  excerpt: `Excerpt ${id}`,
  featured: false,
  id,
  image: null,
  publishedAt: `2026-08-${String(28 - id).padStart(2, '0')}T08:00:00.000Z`,
  readingMinutes: 4,
  slug: `article-${id}`,
  title: `Article ${id}`,
  ...over,
})

describe('article markdown', () => {
  test('turns headings, lists, quotes and paragraphs into Lexical blocks', () => {
    const { root } = markdownToLexical(`
## Section

Plain **bold** and *italic* with a [link](/contact).

- one
- two

1. first
2. second

> Quoted line

### Sub-section

![Machine](media:42)
`)

    expect(root.children.map((node) => node.type)).toEqual([
      'heading',
      'paragraph',
      'list',
      'list',
      'quote',
      'heading',
      'upload',
    ])
    expect(root.children[0]).toMatchObject({ tag: 'h2' })
    expect(root.children[2]).toMatchObject({ listType: 'bullet', tag: 'ul' })
    expect(root.children[3]).toMatchObject({ listType: 'number', tag: 'ol' })
    expect(root.children[6]).toMatchObject({ relationTo: 'media', value: 42 })

    const inline = parseInline('Plain **bold** and *italic* with a [link](/contact).')
    expect(inline.map((node) => node.type)).toEqual([
      'text',
      'text',
      'text',
      'text',
      'text',
      'link',
      'text',
    ])
    expect(inline[1]).toMatchObject({ format: 1, text: 'bold' })
    expect(inline[3]).toMatchObject({ format: 2, text: 'italic' })
    expect(inline[5]).toMatchObject({ fields: { newTab: false, url: '/contact' } })
    // External links open in a new tab; internal ones do not.
    expect(parseInline('[x](https://example.com)')[0]).toMatchObject({ fields: { newTab: true } })
  })
})

describe('article outline', () => {
  const content = markdownToLexical(`
## Key takeaways

- A point

## Tolerances & fits

### Holes

## Tolerances & fits
`)

  test('gives each heading a unique id and lists sections and sub-sections', () => {
    expect(headingSlug('What is sheet metal prototyping?')).toBe('what-is-sheet-metal-prototyping')
    expect(headingIds(content)).toEqual([
      'key-takeaways',
      'tolerances-and-fits',
      'holes',
      'tolerances-and-fits-2',
    ])
    expect(articleOutline(content)).toEqual([
      { id: 'key-takeaways', level: 2, text: 'Key takeaways' },
      { id: 'tolerances-and-fits', level: 2, text: 'Tolerances & fits' },
      { id: 'holes', level: 3, text: 'Holes' },
      { id: 'tolerances-and-fits-2', level: 2, text: 'Tolerances & fits' },
    ])
  })

  test('reads at an unhurried pace, never under a minute', () => {
    expect(readingMinutes(markdownToLexical('Short.'))).toBe(1)
    expect(readingMinutes(markdownToLexical(Array(880).fill('word').join(' ')))).toBe(4)
  })
})

/*
 * The committed articles are original writing for Sky Wings, and the seed
 * writes them as they are -- so each must parse, open with its takeaways, and
 * name only pictures the seed knows how to find.
 */
describe('seeded articles', () => {
  test('each parses, opens with key takeaways, and names known pictures', () => {
    const slugs = new Set<string>()

    for (const seed of articleSeeds) {
      expect(slugs.has(seed.slug), seed.slug).toBe(false)
      slugs.add(seed.slug)

      expect(seed.image in ARTICLE_MEDIA, seed.slug).toBe(true)
      for (const [, key] of seed.body.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(key in ARTICLE_MEDIA, `${seed.slug}: ${key}`).toBe(true)
      }

      const content = markdownToLexical(seed.body.replace(/\{\{\w+\}\}/g, 'media:1'))
      const outline = articleOutline(content)
      expect(outline[0]?.text, seed.slug).toBe('Key takeaways')
      expect(outline.length, seed.slug).toBeGreaterThan(4)
      expect(readingMinutes(content), seed.slug).toBeGreaterThanOrEqual(2)
    }

    // One lead story.
    expect(articleSeeds.filter((seed) => seed.featured)).toHaveLength(1)
  })
})

describe('hub query', () => {
  const articles = Array.from({ length: 12 }, (_, index) => card(index + 1))

  test('reads the view from the address and writes one address per view', () => {
    expect(parseArticleQuery({ category: 'techniques', page: '2' })).toEqual({
      category: 'techniques',
      page: 2,
    })
    expect(parseArticleQuery({ category: 'nonsense', page: '-3' })).toEqual({
      category: null,
      page: 1,
    })
    expect(articlesHref({ category: null, page: 1 })).toBe('/resources')
    expect(articlesHref({ category: 'design', page: 3 })).toBe('/resources?category=design&page=3')
  })

  test('leads with the featured article, else the newest, and pages the rest', () => {
    const newest = queryArticles(articles, { category: null, page: 1 })
    expect(newest.featured?.id).toBe(1)
    expect(newest.cards).toHaveLength(ARTICLES_PAGE_SIZE)
    expect(newest.cards.map((item) => item.id)).not.toContain(1)
    expect(newest).toMatchObject({ from: 1, page: 1, pageCount: 2, to: 10, total: 12 })

    const second = queryArticles(articles, { category: null, page: 2 })
    expect(second.featured).toBeNull()
    expect(second.cards.map((item) => item.id)).toEqual([11, 12])
    expect(second).toMatchObject({ from: 11, to: 12 })

    const pinned = queryArticles([...articles.slice(0, 5), card(99, { featured: true })], {
      category: null,
      page: 1,
    })
    expect(pinned.featured?.id).toBe(99)

    // A page past the end shows the last one.
    expect(queryArticles(articles, { category: null, page: 9 }).page).toBe(2)
  })

  test('filters by category and offers only categories that have articles', () => {
    const mixed = [card(1), card(2, { category: 'techniques', categoryLabel: 'Techniques' })]
    const result = queryArticles(mixed, { category: 'techniques', page: 1 })

    expect(result.total).toBe(1)
    expect(result.featured?.id).toBe(2)
    expect(result.categories.map((category) => category.value)).toEqual(['guides', 'techniques'])
  })

  test('suggests the same category first, never the article itself', () => {
    const pool = [
      card(1),
      card(2, { category: 'design' }),
      card(3, { category: 'design' }),
      card(4),
    ]
    expect(
      relatedArticles(pool, { category: 'design', slug: 'article-2' }).map((a) => a.id),
    ).toEqual([3, 1, 4])
  })
})

describe('resources pages', () => {
  afterEach(cleanup)

  test('the hub sets the lead story, the grid and the filter as links', () => {
    const articles = [card(1, { featured: true }), card(2, { category: 'design' }), card(3)]
    const query = { category: null, page: 1 }
    const { container } = render(
      <ResourcesHub query={query} result={queryArticles(articles, query)} />,
    )
    const hub = within(container)

    expect(hub.getByRole('heading', { level: 1 }).textContent).toBe('Latest Guides and Insights')
    expect(hub.getByRole('link', { name: 'Article 1' }).getAttribute('href')).toBe(
      '/resources/article-1',
    )
    expect(container.querySelectorAll('.hub-card')).toHaveLength(2)
    const filter = hub.getByRole('navigation', { name: 'Article categories' })
    expect(within(filter).getByRole('link', { name: 'All' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(
      within(filter).getByRole('link', { name: 'Design for Manufacturing' }).getAttribute('href'),
    ).toBe('/resources?category=design')
    expect(container.querySelector('.hub-pager-count')?.textContent).toBe(
      'Showing 1 - 3 of 3 articles',
    )
  })

  test('an article gives its headings the ids its table of contents links to', () => {
    const seed = articleSeeds[0]
    // An id no list item's own "value" can collide with.
    const content = markdownToLexical(seed.body.replace(/\{\{\w+\}\}/g, 'media:7777'))
    // As Payload returns it once the upload is populated.
    const populated = JSON.parse(
      JSON.stringify(content).replace(
        '"value":7777',
        '"value":{"alt":"Laser machine","mimeType":"image/png","url":"/media/laser.png"}',
      ),
    ) as BlogPost['content']

    const article: Article = {
      ...card(1, { slug: seed.slug, title: seed.title }),
      byline: DEFAULT_BYLINE,
      content: populated,
      outline: articleOutline(populated),
      seo: null as unknown as Article['seo'],
      updatedAt: seed.publishedAt,
    }
    const { container } = render(<ArticlePage article={article} related={[card(2)]} />)

    const toc = container.querySelector('.post-aside .post-toc') as HTMLElement
    const targets = Array.from(toc.querySelectorAll('a')).map((link) => link.getAttribute('href'))
    const ids = Array.from(container.querySelectorAll('.post-body h2, .post-body h3')).map(
      (heading) => `#${heading.id}`,
    )
    expect(targets).toEqual(ids)
    expect(container.querySelector('.rich-text-figure img')?.getAttribute('src')).toBe(
      '/media/laser.png',
    )
    expect(within(container).getByText('Sky Wings Engineering')).toBeTruthy()
    expect(
      within(container)
        .getByRole('link', { name: /Request a quote/ })
        .getAttribute('href'),
    ).toBe('/contact')
  })

  /*
   * Where the bar's Resources entry points is the Header global's business
   * now -- it used to be rewritten to the hub in code, whatever the CMS said.
   * What is left here is the fallback the site falls back to when Payload
   * cannot be reached, which must still lead to the hub rather than the old
   * blog.
   */
  test('moves the blog to the hub and points Resources at it', () => {
    expect(read('next.config.ts')).toMatch(
      /source: '\/blog\/:slug', destination: '\/resources\/:slug', permanent: true/,
    )
    expect(defaultHeaderData.navigation.find((item) => item.label === 'Resources')?.href).toBe(
      '/resources',
    )
  })
})
