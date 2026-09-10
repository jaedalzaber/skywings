import Link from 'next/link'

import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { articlesHref, type ArticleHubResult, type ArticleQuery } from '@/data/articleQuery'
import { pagerWindow } from '@/data/catalogQuery'
import { formatArticleDate, readingTimeLabel } from '@/lib/articles/format'

import { ArticleCard, articleHref, LongArrow } from './ArticleCard'

export const resourcesHubCopy = {
  heading: 'Latest Guides and Insights',
  intro:
    'Practical notes from the Sky Wings shop floor on cutting, forming, welding and finishing metal — for the engineers and buyers who specify it.',
}

/**
 * The knowledge hub: a centred head with the category filter, the lead
 * article set large, then the rest in a three-column grid with the pager
 * under it. Every control is a link -- the view is the address -- so a
 * filtered or paged view can be shared, bookmarked and crawled.
 */
export function ResourcesHub({ query, result }: { query: ArticleQuery; result: ArticleHubResult }) {
  const { featured } = result
  const leadDate = featured ? formatArticleDate(featured.publishedAt) : null

  return (
    <div className="hub" data-nav-surface="white">
      <div className="hub-inner">
        <RevealGroup as="header" className="hub-head" stagger={0.08}>
          <RevealItem as="h1" className="hub-title">
            {resourcesHubCopy.heading}
          </RevealItem>
          <RevealItem as="p" className="hub-intro">
            {resourcesHubCopy.intro}
          </RevealItem>
          {result.categories.length > 1 ? (
            <RevealItem as="div" className="hub-filter-wrap">
              <nav aria-label="Article categories" className="hub-filter">
                <FilterPill
                  active={!query.category}
                  href={articlesHref({ category: null, page: 1 })}
                >
                  All
                </FilterPill>
                {result.categories.map((category) => (
                  <FilterPill
                    active={query.category === category.value}
                    href={articlesHref({ category: category.value, page: 1 })}
                    key={category.value}
                  >
                    {category.label}
                  </FilterPill>
                ))}
              </nav>
            </RevealItem>
          ) : null}
        </RevealGroup>

        {featured ? (
          <RevealGroup as="article" className="hub-lead" stagger={0.1}>
            <RevealItem className="hub-lead-media" motion="fade">
              {featured.image ? (
                <SafeImg alt={featured.image.alt} src={featured.image.url} />
              ) : (
                <span aria-hidden="true" className="hub-media-empty" />
              )}
            </RevealItem>
            <div className="hub-lead-copy">
              <RevealItem as="p" className="hub-lead-meta">
                {[featured.categoryLabel, leadDate, readingTimeLabel(featured.readingMinutes)]
                  .filter(Boolean)
                  .join(' · ')}
              </RevealItem>
              <RevealItem as="h2" className="hub-lead-title">
                <Link className="hub-lead-link" href={articleHref(featured.slug)}>
                  {featured.title}
                </Link>
              </RevealItem>
              <RevealItem as="p" className="hub-lead-excerpt">
                {featured.excerpt}
              </RevealItem>
              <RevealItem as="div">
                <span aria-hidden="true" className="hub-button hub-button--large">
                  Read More <LongArrow />
                </span>
              </RevealItem>
            </div>
          </RevealGroup>
        ) : (
          <div className="hub-empty">
            <p className="hub-empty-title">No articles here yet.</p>
            <p className="hub-empty-text">
              New guides are on the way. In the meantime, our{' '}
              <Link href="/capabilities">capabilities</Link> page shows every process we run.
            </p>
          </div>
        )}

        {result.cards.length ? (
          <RevealGroup as="div" className="hub-grid" stagger={0.06}>
            {result.cards.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </RevealGroup>
        ) : null}

        {result.total ? <HubPager query={query} result={result} /> : null}

        <aside className="hub-downloads">
          <p>
            <strong>Looking for spec sheets?</strong> Product brochures and drawings are in the
            downloads library.
          </p>
          <Link className="hub-downloads-link" href="/brochures">
            Brochures <LongArrow />
          </Link>
        </aside>
      </div>
    </div>
  )
}

function FilterPill(props: { active: boolean; children: React.ReactNode; href: string }) {
  return (
    <Link
      aria-current={props.active ? 'page' : undefined}
      className="hub-pill"
      data-active={props.active ? 'true' : 'false'}
      href={props.href}
    >
      {props.children}
    </Link>
  )
}

/** "Showing 1 - 7 of 7 articles" on the left, the page numbers on the right. */
function HubPager({ query, result }: { query: ArticleQuery; result: ArticleHubResult }) {
  const pages = pagerWindow(result.page, result.pageCount)
  const to = (page: number) => articlesHref({ ...query, page })

  return (
    <div className="hub-pager">
      <p className="hub-pager-count">
        Showing {result.from} - {result.to} of {result.total}{' '}
        {result.total === 1 ? 'article' : 'articles'}
      </p>
      {result.pageCount > 1 ? (
        <nav aria-label="Pages" className="hub-pages">
          <PagerStep disabled={result.page <= 1} href={to(result.page - 1)} label="Previous page">
            ‹
          </PagerStep>
          {pages.map((page, index) =>
            page === 'gap' ? (
              <span aria-hidden="true" className="hub-page-gap" key={`gap-${index}`}>
                …
              </span>
            ) : (
              <Link
                aria-current={page === result.page ? 'page' : undefined}
                className="hub-page"
                data-active={page === result.page ? 'true' : 'false'}
                href={to(page)}
                key={page}
              >
                {page}
              </Link>
            ),
          )}
          <PagerStep
            disabled={result.page >= result.pageCount}
            href={to(result.page + 1)}
            label="Next page"
          >
            ›
          </PagerStep>
        </nav>
      ) : null}
    </div>
  )
}

function PagerStep(props: { children: string; disabled: boolean; href: string; label: string }) {
  if (props.disabled) {
    return (
      <span aria-hidden="true" className="hub-page hub-page--step" data-disabled="true">
        {props.children}
      </span>
    )
  }

  return (
    <Link aria-label={props.label} className="hub-page hub-page--step" href={props.href}>
      <span aria-hidden="true">{props.children}</span>
    </Link>
  )
}
