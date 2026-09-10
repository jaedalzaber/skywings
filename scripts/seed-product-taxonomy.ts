/**
 * Applies the product taxonomy in src/data/productTaxonomy.ts to Payload.
 *
 * The Products mega menu builds one column per industry from the families
 * that name it in `industryFocus`. The dummy seed had filled that field with
 * `industries.slice(0, 4)` for every non-aviation family, so five columns
 * listed the same eight families and Industrial Manufacturing never appeared
 * at all. Only the aviation column, seeded separately, was correct.
 *
 * This script:
 *   1. upserts every family in the taxonomy (title, summary, sortOrder),
 *   2. sets each one's industryFocus from the industry -> families map,
 *   3. clears industryFocus on superseded families so they leave the menu
 *      without being deleted, and re-files any product still sitting in one,
 *   4. moves the handful of products whose family changed under the new
 *      taxonomy, matched on SKU.
 *
 * Idempotent: re-running writes the same values. Products are matched on SKU
 * and families on slug, so nothing is duplicated.
 *
 *   pnpm run seed:product-taxonomy
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import {
  INDUSTRY_FAMILY_FOCUS,
  NON_PRODUCT_INDUSTRIES,
  PALLET_AND_NET_SKUS,
  PRODUCT_FAMILIES,
  REMOVED_FAMILIES,
  SUPERSEDED_FAMILIES,
  industriesForFamily,
} from '../src/data/productTaxonomy'

/**
 * Products whose correct family changed with the new taxonomy, by SKU. Tanks
 * are process equipment rather than generic heavy fabrication, which is also
 * what gives Oil & Gas its first real entry. The pallets and net left the
 * combined ULD family for their own; step 3 would otherwise send them on to
 * ULD Containers with the rest of it.
 */
const PRODUCT_REFILES: Readonly<Record<string, string>> = {
  'SW-HF-002': 'process-equipment-and-piping-supports',
  ...Object.fromEntries(PALLET_AND_NET_SKUS.map((sku) => [sku, 'pallets-and-nets'])),
}

const payload = await getPayload({ config })

const industries = await payload.find({
  collection: 'industries',
  depth: 0,
  limit: 100,
  overrideAccess: true,
})
const industryIdBySlug = new Map<string, number>(
  industries.docs.map((doc) => [doc.slug as string, doc.id as number]),
)

const unknownIndustries = Object.keys(INDUSTRY_FAMILY_FOCUS).filter(
  (slug) => !industryIdBySlug.has(slug),
)
if (unknownIndustries.length) {
  console.warn(`WARNING unknown industry slugs, skipped: ${unknownIndustries.join(', ')}`)
}

const families = await payload.find({
  collection: 'product-families',
  depth: 0,
  limit: 200,
  overrideAccess: true,
})
const familyBySlug = new Map(families.docs.map((doc) => [doc.slug as string, doc]))

// 1 + 2: every family in the taxonomy, focused on the industries that buy it.
for (const family of PRODUCT_FAMILIES) {
  const focus = industriesForFamily(family.slug)
    .map((slug) => industryIdBySlug.get(slug))
    .filter((id): id is number => id !== undefined)

  const data = {
    _status: 'published' as const,
    industryFocus: focus,
    slug: family.slug,
    sortOrder: family.sortOrder,
    summary: family.summary,
    title: family.title,
  }

  const existing = familyBySlug.get(family.slug)
  if (existing) {
    await payload.update({ collection: 'product-families', data, id: existing.id, overrideAccess: true })
    console.log(`update  ${family.slug} (${focus.length} industries)`)
  } else {
    const created = await payload.create({ collection: 'product-families', data, overrideAccess: true })
    familyBySlug.set(family.slug, created)
    console.log(`create  ${family.slug} (${focus.length} industries)`)
  }
}

// Re-read so families created above are available as re-file targets.
const refreshed = await payload.find({
  collection: 'product-families',
  depth: 0,
  limit: 200,
  overrideAccess: true,
})
const familyIdBySlug = new Map<string, number>(
  refreshed.docs.map((doc) => [doc.slug as string, doc.id as number]),
)

const products = await payload.find({
  collection: 'products',
  depth: 1,
  limit: 500,
  overrideAccess: true,
})

async function refile(sku: string, id: number, targetSlug: string, reason: string) {
  const targetId = familyIdBySlug.get(targetSlug)
  if (targetId === undefined) {
    console.warn(`WARNING no family ${targetSlug}, left ${sku} where it was`)
    return
  }

  await payload.update({
    collection: 'products',
    data: { productFamily: targetId },
    id,
    overrideAccess: true,
  })
  console.log(`refile  ${sku} -> ${targetSlug} (${reason})`)
}

// 3: superseded families lose their focus, and anything still filed under one
// moves to its successor so no product falls out of the catalogue.
for (const [slug, successor] of Object.entries(SUPERSEDED_FAMILIES)) {
  const doc = familyBySlug.get(slug)
  if (!doc) continue

  for (const product of products.docs) {
    const family = product.productFamily
    const familySlug = typeof family === 'object' && family ? family.slug : undefined
    if (familySlug === slug) {
      await refile(product.sku ?? String(product.id), product.id, successor, `${slug} retired`)
    }
  }

  await payload.update({
    collection: 'product-families',
    data: { industryFocus: [] },
    id: doc.id,
    overrideAccess: true,
  })
  console.log(`retire  ${slug} -> ${successor}`)
}

/*
 * 3b: families that leave the catalogue rather than being replaced. These are
 * deleted, not retired, so they stop appearing in the admin's family list --
 * but only when empty. One still holding products keeps them, and is reported
 * instead, because where those products belong is an editorial decision.
 */
for (const slug of REMOVED_FAMILIES) {
  const doc = familyBySlug.get(slug)
  if (!doc) continue

  const held = products.docs.filter((product) => {
    const family = product.productFamily
    return typeof family === 'object' && family ? family.slug === slug : false
  })

  if (held.length) {
    console.warn(
      `WARNING ${slug} still holds ${held.length} product(s), not deleted: ` +
        held.map((product) => product.sku ?? product.id).join(', '),
    )
    continue
  }

  await payload.delete({ collection: 'product-families', id: doc.id, overrideAccess: true })
  familyBySlug.delete(slug)
  console.log(`remove  ${slug} (left the catalogue, held no products)`)
}

// 4: products whose family changed under the new taxonomy.
for (const product of products.docs) {
  const target = product.sku ? PRODUCT_REFILES[product.sku] : undefined
  if (!target) continue

  const family = product.productFamily
  const familySlug = typeof family === 'object' && family ? family.slug : undefined
  if (familySlug === target) continue

  await refile(product.sku as string, product.id, target, 'taxonomy change')
}

/*
 * 5: industries that are not product categories come off the products that
 * still name them, so /products stops offering them as a filter. A ladder
 * built for an airline is aviation GSE; tagging it "Maintenance & Repair
 * Services" described the buyer's activity, not the product.
 */
for (const product of products.docs) {
  const current = (product.industries ?? []).map((industry) =>
    typeof industry === 'object' ? industry : { id: industry, slug: undefined },
  )
  const kept = current.filter(
    (industry) => !NON_PRODUCT_INDUSTRIES.includes(industry.slug ?? ''),
  )

  if (kept.length === current.length) continue

  await payload.update({
    collection: 'products',
    data: { industries: kept.map((industry) => industry.id as number) },
    id: product.id,
    overrideAccess: true,
  })
  console.log(`untag   ${product.sku ?? product.id} (dropped non-product industries)`)
}

// Report the menu as it will now render.
const final = await payload.find({
  collection: 'product-families',
  depth: 1,
  limit: 200,
  overrideAccess: true,
  sort: 'sortOrder',
})

console.log('\nProducts menu columns:')
for (const industry of industries.docs) {
  const columns = final.docs
    .filter((family) =>
      (family.industryFocus ?? []).some((focus) =>
        typeof focus === 'object' ? focus.slug === industry.slug : false,
      ),
    )
    .map((family) => family.title)

  if (columns.length) {
    console.log(`  ${industry.title}\n    - ${columns.join('\n    - ')}`)
  }
}

process.exit(0)
