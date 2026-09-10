import { ARTICLE_CATEGORIES, isArticleCategory, type ArticleCategory } from './articleCategories'
import type { ArticleCard } from './articles'

/*
 * The hub's state lives in the address, as the product catalogue's does: the
 * category and the page are query parameters, and the server renders exactly
 * the view they name. Pure, so the whole of it can be tested directly.
 */

/** Three columns by three rows under the lead article. */
export const ARTICLES_PAGE_SIZE = 9

export type ArticleQuery = { category: ArticleCategory | null; page: number }

export type ArticleCategoryOption = { count: number; label: string; value: ArticleCategory }

export type ArticleHubResult = {
  /** Categories with at least one article, in the admin's order. */
  categories: ArticleCategoryOption[]
  cards: ArticleCard[]
  /** The lead article, on the first page of a view only. */
  featured: ArticleCard | null
  /** 1-based position of the first article shown, lead included. */
  from: number
  page: number
  pageCount: number
  to: number
  total: number
}

type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return ((Array.isArray(value) ? value[0] : value) ?? '').trim()
}

/** Anything unrecognised falls back to the default view rather than failing. */
export function parseArticleQuery(params: RawParams): ArticleQuery {
  const category = first(params.category)
  const page = Number.parseInt(first(params.page), 10)

  return {
    category: isArticleCategory(category) ? category : null,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  }
}

/** One address per view: the defaults are left out. */
export function articlesHref(query: ArticleQuery) {
  const params = new URLSearchParams()
  if (query.category) params.set('category', query.category)
  if (query.page > 1) params.set('page', String(query.page))

  const search = params.toString()
  return `/resources${search ? `?${search}` : ''}`
}

/**
 * One page of the hub. The lead is the article ticked as featured, or the
 * newest when none is; it heads the first page and the grid pages through the
 * rest. Articles arrive newest first, and each group keeps that order.
 */
export function queryArticles(
  articles: ArticleCard[],
  query: ArticleQuery,
  pageSize = ARTICLES_PAGE_SIZE,
): ArticleHubResult {
  const categories = ARTICLE_CATEGORIES.map(({ label, value }) => ({
    count: articles.filter((article) => article.category === value).length,
    label,
    value,
  })).filter((category) => category.count > 0)

  const inView = query.category
    ? articles.filter((article) => article.category === query.category)
    : articles
  const lead = inView.find((article) => article.featured) ?? inView[0] ?? null
  const rest = inView.filter((article) => article !== lead)

  const pageCount = Math.max(1, Math.ceil(rest.length / pageSize))
  const page = Math.min(query.page, pageCount)
  const cards = rest.slice((page - 1) * pageSize, page * pageSize)
  const featured = page === 1 ? lead : null

  // Counted over the whole view: the lead is article 1 of page 1.
  const offset = page === 1 ? 0 : 1 + (page - 1) * pageSize
  const shown = cards.length + (featured ? 1 : 0)

  return {
    cards,
    categories,
    featured,
    from: shown ? offset + 1 : 0,
    page,
    pageCount,
    to: offset + shown,
    total: inView.length,
  }
}

/**
 * Further reading under an article: the same category first, then the newest
 * of the rest, never the article itself.
 */
export function relatedArticles(
  articles: ArticleCard[],
  current: Pick<ArticleCard, 'category' | 'slug'>,
  limit = 3,
): ArticleCard[] {
  const others = articles.filter((article) => article.slug !== current.slug)
  const same = others.filter((article) => current.category && article.category === current.category)

  return [...same, ...others.filter((article) => !same.includes(article))].slice(0, limit)
}
