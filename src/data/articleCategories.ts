/*
 * The knowledge hub's categories. One list for the admin's select, the hub's
 * filter pills and the article breadcrumb, so a category added here appears in
 * all three. Kept free of Payload imports so the collection config and client
 * components can both import it.
 *
 * Values are stored on the articles: rename a label freely, but a value can
 * only be added, never changed -- the column is an enum.
 */
export const ARTICLE_CATEGORIES = [
  { label: 'Guides', value: 'guides' },
  { label: 'Design for Manufacturing', value: 'design' },
  { label: 'Techniques', value: 'techniques' },
  { label: 'Materials & Finishes', value: 'materials' },
  { label: 'Industry Insights', value: 'insights' },
  { label: 'Case Studies', value: 'case-studies' },
] as const

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]['value']

export function isArticleCategory(value: unknown): value is ArticleCategory {
  return ARTICLE_CATEGORIES.some((category) => category.value === value)
}

export function articleCategoryLabel(value: string | null | undefined): string | null {
  return ARTICLE_CATEGORIES.find((category) => category.value === value)?.label ?? null
}
