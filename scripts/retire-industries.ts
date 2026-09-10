/**
 * Retires a sector across the whole site.
 *
 * Oil & Gas and Marine & Offshore are no longer served, and they appeared in
 * five places: the header Industries dropdown, the /industries listing, the
 * home "Industries we serve" band, the /products industry filter, and their
 * own /industries/<slug> pages. All five read published documents, so
 * unpublishing the industry and its page removes the sector everywhere at once
 * -- no per-surface edits, and nothing to miss.
 *
 * Unpublished rather than deleted: products, industry pages and menu items
 * still reference these documents by id, and a delete would leave those
 * relationships dangling. A draft is invisible to every public query
 * (`publishedOrAuthenticated` read access) and can be restored by publishing
 * it again in the admin.
 *
 * Product tags are stripped separately, because a product carrying the sector
 * would still surface it as a filter chip on /products.
 *
 * Idempotent: re-running reports "already retired" and changes nothing.
 *
 *   pnpm run retire:industries
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import { NON_PRODUCT_INDUSTRIES } from '../src/data/productTaxonomy'

/** Sectors to unpublish. Kept narrower than NON_PRODUCT_INDUSTRIES, which also
 *  holds Maintenance & Repair Services -- that one keeps its sector page. */
const RETIRED = ['oil-and-gas', 'marine-and-offshore']

const payload = await getPayload({ config })

for (const collection of ['industries', 'industry-pages'] as const) {
  for (const slug of RETIRED) {
    const { docs } = await payload.find({
      collection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: slug } },
    })

    const doc = docs[0]
    if (!doc) {
      console.log(`skip    ${collection}/${slug} (not found)`)
      continue
    }

    if ((doc as unknown as { _status?: string })._status === 'draft') {
      console.log(`ok      ${collection}/${slug} (already retired)`)
      continue
    }

    await payload.update({
      collection,
      // No `draft: true`: that files a draft *version* and leaves the
      // published one live. Updating the document status is what unpublishes.
      data: { _status: 'draft' } as never,
      id: doc.id,
      overrideAccess: true,
    })
    console.log(`retire  ${collection}/${slug}`)
  }
}

// Strip the retired sectors (and any other non-product industry) from products.
const products = await payload.find({
  collection: 'products',
  depth: 1,
  limit: 500,
  overrideAccess: true,
})

for (const product of products.docs) {
  const current = (product.industries ?? []).map((industry) =>
    typeof industry === 'object' && industry
      ? { id: industry.id, slug: industry.slug }
      : { id: industry, slug: undefined },
  )
  const kept = current.filter((industry) => !NON_PRODUCT_INDUSTRIES.includes(industry.slug ?? ''))

  if (kept.length === current.length) continue

  await payload.update({
    collection: 'products',
    data: { industries: kept.map((industry) => industry.id as number) },
    id: product.id,
    overrideAccess: true,
  })
  console.log(
    `untag   ${product.sku ?? product.id} -> ${kept.map((i) => i.slug).join(', ') || '(none)'}`,
  )
}

const published = await payload.find({
  collection: 'industries',
  depth: 0,
  limit: 100,
  overrideAccess: false,
  sort: 'sortOrder',
})

console.log('\nsectors still published:')
for (const industry of published.docs) console.log(`  ${industry.title}`)

process.exit(0)
