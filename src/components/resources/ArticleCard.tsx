import Link from 'next/link'

import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealItem } from '@/components/motion/Reveal'
import type { ArticleCard as ArticleCardData } from '@/data/articles'
import { formatArticleDate } from '@/lib/articles/format'

/** The long arrow the design sets after "Read More". */
export function LongArrow() {
  return (
    <svg aria-hidden="true" className="hub-arrow" fill="none" viewBox="0 0 26 10">
      <path d="M0 5h24.5M20.5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export const articleHref = (slug: string) => `/resources/${slug}`

/**
 * An article in the grid: picture, title, the excerpt, and a "Read More" with
 * the date opposite. The title is the link, stretched over the whole card, so
 * the card is one target without nesting a button inside a link.
 */
export function ArticleCard({ article }: { article: ArticleCardData }) {
  const date = formatArticleDate(article.publishedAt)

  return (
    <RevealItem as="article" className="hub-card">
      <div className="hub-card-media">
        {article.image ? (
          <SafeImg alt={article.image.alt} loading="lazy" src={article.image.url} />
        ) : (
          <span aria-hidden="true" className="hub-media-empty" />
        )}
      </div>
      <div className="hub-card-body">
        {article.categoryLabel ? (
          <p className="hub-card-category">{article.categoryLabel}</p>
        ) : null}
        <h3 className="hub-card-title">
          <Link className="hub-card-link" href={articleHref(article.slug)}>
            {article.title}
          </Link>
        </h3>
        <p className="hub-card-excerpt">{article.excerpt}</p>
        <div className="hub-card-foot">
          <span aria-hidden="true" className="hub-button">
            Read More <LongArrow />
          </span>
          {date ? (
            <time className="hub-card-date" dateTime={article.publishedAt ?? undefined}>
              {date}
            </time>
          ) : null}
        </div>
      </div>
    </RevealItem>
  )
}
