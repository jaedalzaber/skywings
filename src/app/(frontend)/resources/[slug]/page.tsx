import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticlePage } from '@/components/resources/ArticlePage'
import { relatedArticles } from '@/data/articleQuery'
import { getArticleBySlug, getArticleCards } from '@/data/articles'

type ArticleRouteProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const cards = await getArticleCards()
  return cards.map((card) => ({ slug: card.slug }))
}

export async function generateMetadata(props: ArticleRouteProps): Promise<Metadata> {
  const { slug } = await props.params
  const article = await getArticleBySlug(slug)
  if (!article) return {}

  const title = article.seo?.title || article.title
  const description = article.seo?.description || article.excerpt

  return {
    title,
    description,
    robots: article.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      images: article.image ? [{ url: article.image.url, alt: article.image.alt }] : undefined,
      publishedTime: article.publishedAt ?? undefined,
      type: 'article',
    },
  }
}

export default async function ArticleRoute(props: ArticleRouteProps) {
  const { slug } = await props.params
  const article = await getArticleBySlug(slug)

  if (!article) notFound()

  const related = relatedArticles(await getArticleCards(), article)

  return <ArticlePage article={article} related={related} />
}
