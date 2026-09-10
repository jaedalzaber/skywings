import { HomeLocationsSection } from '@/components/home/HomeLocationsSection'
import { DarkFooterSurface } from '@/components/layout/DarkFooterSurface'
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { getProductBySlug } from '@/data/catalog'
import { contactLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'
import {
  getProductParam,
  hasSubmitError,
  hasSubmitted,
  type RouteSearchParams,
} from '@/data/searchParams'
import { getSiteFooter } from '@/data/site'

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

/**
 * Where the header's "Get in touch" and every quote link lands: the enquiry
 * form, then the branches, dark from the top of the page through the footer.
 */
export default async function ContactPage(props: { searchParams: RouteSearchParams }) {
  const [layout, submitted, error, productSlug, footer] = await Promise.all([
    getPageLayout('contact', contactLayout),
    hasSubmitted(props.searchParams),
    hasSubmitError(props.searchParams),
    getProductParam(props.searchParams),
    getSiteFooter(),
  ])
  const productInterest = await resolveProductInterest(productSlug)

  return (
    <div className="contact-page" data-nav-surface="dark" data-page-tone="dark">
      <PageBlocks
        blocks={layout}
        error={error}
        productInterest={productInterest}
        submitted={submitted}
      />
      <HomeLocationsSection addresses={footer.addresses} image={footer.locationsImage} tone="dark" />
      <DarkFooterSurface />
    </div>
  )
}
