import { cleanup, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { HomeInsightsSection } from '@/components/home/HomeInsightsSection'
import type { ArticleCard } from '@/data/articles'
import { defaultHomeLayout } from '@/data/home'
import { pickHomeArticles } from '@/data/homeInsights'

afterEach(cleanup)

const pageSource = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/page.tsx'), 'utf8')
const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

const card = (id: number, over: Partial<ArticleCard> = {}): ArticleCard => ({
  category: 'guides',
  categoryLabel: 'Guides',
  excerpt: `Excerpt ${id}`,
  featured: false,
  id,
  image: { alt: `Picture ${id}`, url: `/media/${id}.png` },
  publishedAt: `2026-09-0${id}T00:00:00.000Z`,
  readingMinutes: 6,
  slug: `article-${id}`,
  title: `Article ${id}`,
  ...over,
})

describe('HomeInsightsSection', () => {
  test('shows the featured articles first, then the newest, three in all', () => {
    // Newest first, as the hub hands them over.
    const cards = [
      card(5),
      card(4),
      card(3, { featured: true }),
      card(2),
      card(1, { featured: true }),
    ]

    expect(pickHomeArticles(cards).map((article) => article.id)).toEqual([3, 1, 5])
    expect(pickHomeArticles(cards.slice(0, 2)).map((article) => article.id)).toEqual([5, 4])
  })

  test('links each article and the hub, without saying who wrote them', () => {
    render(<HomeInsightsSection articles={[card(1), card(2), card(3)]} />)
    const section = screen.getByRole('region', {
      name: 'Every job teaches us something. The useful parts, we write down.',
    })

    expect(
      within(section)
        .getByRole('link', { name: /View all resources/ })
        .getAttribute('href'),
    ).toBe('/resources')
    const titles = within(section).getAllByRole('heading', { level: 3 })
    expect(titles.map((title) => title.textContent)).toEqual([
      'Article 1',
      'Article 2',
      'Article 3',
    ])
    expect(within(titles[0]).getByRole('link').getAttribute('href')).toBe('/resources/article-1')
    expect(within(section).getAllByText('Guides')).toHaveLength(3)
    expect(within(section).getAllByText('6 min read')).toHaveLength(3)
    expect(within(section).getByAltText('Picture 1')).toBeTruthy()
  })

  test('leaves no empty frame when the hub has no articles', () => {
    const { container } = render(<HomeInsightsSection articles={[]} />)

    expect(container.innerHTML).toBe('')
  })

  test('closes the home page, after the process and then the locations', () => {
    const { container } = render(
      <HomeBlockRenderer blocks={defaultHomeLayout} insights={[card(1), card(2), card(3)]} />,
    )
    const section = container.querySelector('#insights')
    const locations = container.querySelector('#locations')

    expect(container.querySelector('#manufacturing-process')?.nextElementSibling).toBe(locations)
    expect(locations?.nextElementSibling).toBe(section)
    expect(section?.nextElementSibling).toBeNull()
    // A failed article read drops the section rather than the page.
    expect(pageSource).toMatch(/getArticleCards\(\)\.catch\(/)
    expect(pageSource).toMatch(/insights=\{pickHomeArticles\(articles\)\}/)
  })

  /*
   * As the process band: the top and bottom rules run to both edges of the
   * screen, and only the vertical lines stop at the page's width -- so the
   * frame has no outer corners to round.
   */
  test('runs its top and bottom rules edge to edge, like the process band', () => {
    const block = stylesheet.slice(stylesheet.indexOf('.insights {'))

    expect(block).toMatch(/\.insights \{[^}]*width:\s*var\(--bleed-width\);/s)
    expect(block).not.toMatch(/\.insights \{[^}]*padding:[^;]*var\(--page-inset\)/s)
    expect(block).toMatch(
      /\.insights-inner \{\s*border-block:\s*1px solid var\(--insights-line\);/s,
    )
    expect(block).toMatch(
      /\.insights-frame \{[^}]*width:\s*min\(100%, var\(--page-content\)\);[^}]*border-inline:\s*1px solid var\(--insights-line\);/s,
    )
    expect(block.slice(0, block.indexOf('.insights-top'))).not.toMatch(/border-radius/)
  })
})
