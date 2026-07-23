import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { getProductBySlug } from '@/data/catalog'
import { contactLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'
import { getProductParam, hasSubmitted, type RouteSearchParams } from '@/data/searchParams'

export const dynamic = 'force-dynamic'

/**
 * Resolve the configurator's ?product=<slug> into a friendly prefill value.
 * The product title is best; the raw slug is an acceptable fallback and a DB
 * hiccup must never break the contact page.
 */
async function resolveProductInterest(slug: string | undefined) {
  if (!slug) {
    return undefined
  }

  try {
    const product = await getProductBySlug(slug)

    return product?.title ?? slug
  } catch {
    return slug
  }
}

export default async function ContactPage(props: { searchParams: RouteSearchParams }) {
  const [layout, submitted, productSlug] = await Promise.all([
    getPageLayout('contact', contactLayout),
    hasSubmitted(props.searchParams),
    getProductParam(props.searchParams),
  ])
  const productInterest = await resolveProductInterest(productSlug)

  return <PageBlocks blocks={layout} productInterest={productInterest} submitted={submitted} />
}
