import type { ProductFilters } from './catalog'

export type RouteSearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function getProductFilters(searchParams: RouteSearchParams): Promise<ProductFilters> {
  const params = await searchParams

  return {
    family: first(params.family),
    industry: first(params.industry),
    q: first(params.q),
    type: first(params.type),
  }
}

export async function hasSubmitted(searchParams: RouteSearchParams) {
  const params = await searchParams

  return first(params.submitted) === '1'
}
