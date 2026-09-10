import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ResourcesHub, resourcesHubCopy } from '@/components/resources/ResourcesHub'
import { pageRedirect } from '@/data/catalogQuery'
import { articlesHref, parseArticleQuery, queryArticles } from '@/data/articleQuery'
import { getArticleCards } from '@/data/articles'
import type { RouteSearchParams } from '@/data/searchParams'

export const metadata: Metadata = {
  title: 'Resources — guides and insights',
  description: resourcesHubCopy.intro,
}

/**
 * The knowledge hub. The category and page come from the address and the
 * view renders from one cached read of the articles, so a request costs a
 * filter over a cached list, not a query.
 */
export default async function ResourcesPage(props: { searchParams: RouteSearchParams }) {
  const params = await props.searchParams
  const query = parseArticleQuery(params)
  const result = queryArticles(await getArticleCards(), query)

  // One address per page: ?page=1 and pages past the end go to the one shown.
  const target = pageRedirect(
    params.page,
    result.page,
    articlesHref({ ...query, page: result.page }),
  )
  if (target) redirect(target)

  return <ResourcesHub query={query} result={result} />
}
