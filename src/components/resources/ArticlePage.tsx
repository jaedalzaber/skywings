import Link from 'next/link'

import { RichText } from '@/components/atoms/RichText'
import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { articlesHref } from '@/data/articleQuery'
import type { Article, ArticleCard as ArticleCardData } from '@/data/articles'
import { formatArticleDate, readingTimeLabel } from '@/lib/articles/format'
import { headingIds } from '@/lib/articles/outline'

import { ArticleCard, LongArrow } from './ArticleCard'
import { ArticleToc } from './ArticleToc'

/**
 * One article: breadcrumb, title and byline over the lead picture, the text
 * in a reading measure, and beside it a table of contents that follows the
 * reader down the page, with a quote prompt under it. Further reading closes
 * the page.
 */
export function ArticlePage({
  article,
  related,
}: {
  article: Article
  related: ArticleCardData[]
}) {
  const date = formatArticleDate(article.publishedAt)
  const ids = headingIds(article.content)

  return (
    <article className="post" data-nav-surface="white">
      <div className="post-inner">
        <div className="post-grid">
          <div className="post-main">
            <RevealGroup as="header" className="post-head" stagger={0.08}>
              <RevealItem as="div">
                <nav aria-label="Breadcrumb" className="post-crumbs">
                  <Link href="/resources">Resources</Link>
                  {article.category && article.categoryLabel ? (
                    <>
                      <span aria-hidden="true" className="post-crumbs-sep">
                        ▸
                      </span>
                      <Link href={articlesHref({ category: article.category, page: 1 })}>
                        {article.categoryLabel}
                      </Link>
                    </>
                  ) : null}
                </nav>
              </RevealItem>
              <RevealItem as="h1" className="post-title">
                {article.title}
              </RevealItem>
              <RevealItem as="div" className="post-byline">
                <span aria-hidden="true" className="post-avatar">
                  {article.byline.avatar ? (
                    <SafeImg alt="" src={article.byline.avatar.url} />
                  ) : (
                    initials(article.byline.name)
                  )}
                </span>
                <span className="post-byline-text">
                  <span className="post-author">{article.byline.name}</span>
                  <span className="post-meta">
                    {date ? <time dateTime={article.publishedAt ?? undefined}>{date}</time> : null}
                    {date ? ' · ' : null}
                    {readingTimeLabel(article.readingMinutes)}
                  </span>
                </span>
              </RevealItem>
            </RevealGroup>

            {article.image ? (
              <RevealItem as="figure" className="post-hero" motion="fade">
                <SafeImg alt={article.image.alt} src={article.image.url} />
              </RevealItem>
            ) : null}

            {/* Narrow screens have no sidebar: the contents sit above the text. */}
            <div className="post-toc-inline">
              <ArticleToc entries={article.outline} variant="inline" />
            </div>

            <RichText className="post-body" headingIds={ids} value={article.content} />
          </div>

          <aside className="post-aside">
            <div className="post-aside-sticky">
              <ArticleToc entries={article.outline} />
              <div className="post-quote">
                <p className="post-quote-eyebrow">Have a part to make?</p>
                <p className="post-quote-title">Send us your drawing</p>
                <p className="post-quote-text">
                  We review every drawing for manufacturability and come back with a price and any
                  suggestions.
                </p>
                <Link className="post-quote-link" href="/contact">
                  Request a quote <LongArrow />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length ? (
          <section aria-labelledby="post-related-title" className="post-related">
            <div className="post-related-head">
              <h2 className="post-related-title" id="post-related-title">
                Keep reading
              </h2>
              <Link className="post-related-all" href="/resources">
                All articles <LongArrow />
              </Link>
            </div>
            <RevealGroup as="div" className="hub-grid" stagger={0.06}>
              {related.map((item) => (
                <ArticleCard article={item} key={item.id} />
              ))}
            </RevealGroup>
          </section>
        ) : null}
      </div>
    </article>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}
