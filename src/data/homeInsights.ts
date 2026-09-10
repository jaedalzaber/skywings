import type { ArticleCard } from './articles'

/*
 * The home page's resources section: a few of the knowledge hub's articles
 * near the close of the page. It never says "we are experts" -- the
 * articles do, by being the kind of thing only a shop that does the work
 * could write. The copy leans on that: the knowledge comes from the jobs, and
 * this is where it gets passed on.
 */
export const homeInsightsCopy = {
  eyebrow: 'Resources',
  headingLead: 'Every job teaches us something.',
  headingTail: 'The useful parts, we write down.',
  ctaLabel: 'View all resources',
  ctaHref: '/resources',
} as const

export const HOME_INSIGHTS_COUNT = 3

/**
 * The articles to show: the ones marked Featured in the admin first, then the
 * newest, so an editor picks the best by ticking a box and the section still
 * fills itself when nothing is ticked. Both runs keep the hub's newest-first
 * order.
 */
export function pickHomeArticles(
  cards: readonly ArticleCard[],
  count: number = HOME_INSIGHTS_COUNT,
): ArticleCard[] {
  const featured = cards.filter((card) => card.featured)
  const rest = cards.filter((card) => !card.featured)

  return [...featured, ...rest].slice(0, count)
}
