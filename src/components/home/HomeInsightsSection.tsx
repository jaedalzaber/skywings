import Link from 'next/link'

import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import type { ArticleCard } from '@/data/articles'
import { homeInsightsCopy } from '@/data/homeInsights'
import { formatArticleDate, readingTimeLabel } from '@/lib/articles/format'

/**
 * A few of the knowledge hub's articles, closing the page after the
 * locations.
 *
 * Drawn in the engineering section's language: hairlines on white, a heading
 * cell beside a cell holding the way into the hub, and the articles as a row
 * of cells under them, each line shared between neighbors. The top and bottom
 * rules run the full width of the screen, as the process band's do; the
 * vertical ones stay within the page. Mono for the labels, blue for what
 * answers the pointer.
 *
 * Renders nothing without articles, so an empty hub leaves no empty frame.
 */
export function HomeInsightsSection({ articles }: { articles: readonly ArticleCard[] }) {
  if (!articles.length) return null

  const copy = homeInsightsCopy

  return (
    <section
      aria-labelledby="insights-title"
      className="insights"
      data-nav-surface="white"
      id="insights"
    >
      <div className="insights-inner">
        <div className="insights-frame">
          <div className="insights-top">
            <RevealGroup as="header" className="insights-head" stagger={0.08}>
              <RevealItem as="p" className="insights-eyebrow">
                {copy.eyebrow}
              </RevealItem>
              <RevealItem as="h2" className="insights-title" id="insights-title">
                <span>{copy.headingLead}</span> <span>{copy.headingTail}</span>
              </RevealItem>
            </RevealGroup>
            <div className="insights-action">
              <Link className="insights-all" href={copy.ctaHref}>
                {copy.ctaLabel}
                <Arrow />
              </Link>
            </div>
          </div>

          <RevealGroup as="div" className="insights-list" stagger={0.08}>
            {articles.map((article) => (
              <InsightCard article={article} key={article.id} />
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}

/*
 * The title is the link, stretched over the whole cell, so the card is one
 * target and "Read more" is its label rather than a second link to the same
 * place.
 */
function InsightCard({ article }: { article: ArticleCard }) {
  const date = formatArticleDate(article.publishedAt)

  return (
    <RevealItem as="article" className="insights-card">
      <div className="insights-card-media">
        {article.image ? (
          <SafeImg alt={article.image.alt} loading="lazy" src={article.image.url} />
        ) : null}
      </div>
      <div className="insights-card-body">
        {/* The category on its own line, so a long one never breaks the date's. */}
        <div className="insights-card-meta">
          {article.categoryLabel ? (
            <span className="insights-card-tag">{article.categoryLabel}</span>
          ) : null}
          <p>
            {date ? (
              <>
                <time dateTime={article.publishedAt ?? undefined}>{date}</time>
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            {readingTimeLabel(article.readingMinutes)}
          </p>
        </div>
        <h3 className="insights-card-title">
          <Link className="insights-card-link" href={`/resources/${article.slug}`}>
            {article.title}
          </Link>
        </h3>
        <p className="insights-card-excerpt">{article.excerpt}</p>
        <span aria-hidden="true" className="insights-card-more">
          Read more <Arrow />
        </span>
      </div>
    </RevealItem>
  )
}

function Arrow() {
  return (
    <svg aria-hidden="true" className="insights-arrow" fill="none" viewBox="0 0 26 10">
      <path d="M0 5h24.5M20.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
