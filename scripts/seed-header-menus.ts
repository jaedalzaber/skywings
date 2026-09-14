/**
 * Fills the Header global's menus from the catalogue, once.
 *
 * The bar used to build the Industries and Products menus itself, from the
 * Industry Pages collection and from Industries x Product Families, and
 * whatever an editor wrote in the Header global was discarded. The Header
 * global is the only source now, so this writes those menus into it: run it
 * to start from what the site was showing, or again later to take a fresh
 * copy of the catalogue over the top.
 *
 * It replaces the children of the Industries and Products rows and leaves
 * every other row, and every switch on them, exactly as it is.
 *
 *   pnpm run seed:header-menus
 *
 * Then clear the cache and restart the dev server, since a script cannot
 * revalidate Next's tags:
 *
 *   pnpm run refresh:cache
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { relationArrayIncludesSlug } from '../src/data/relations'
import { industryRank } from '../src/data/productTaxonomy'

const payload = await getPayload({ config })

const [header, industryPages, industries, families] = await Promise.all([
  payload.findGlobal({ slug: 'header', depth: 0 }),
  payload.find({
    collection: 'industry-pages',
    depth: 0,
    draft: false,
    limit: 50,
    pagination: false,
    overrideAccess: false,
    select: { navLabel: true, slug: true, title: true },
    sort: 'sortOrder',
  }),
  payload.find({
    collection: 'industries',
    depth: 0,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'sortOrder',
  }),
  payload.find({
    collection: 'product-families',
    // Depth 1: the industries a family belongs to are matched by slug, and at
    // depth 0 they arrive as bare ids.
    depth: 1,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'sortOrder',
  }),
])

/** Aviation leads the range, as it does everywhere else it is listed. */
const rankedIndustries = [...industries.docs].sort(
  (a, b) => industryRank(a.slug as string) - industryRank(b.slug as string),
)

const industryMenu = industryPages.docs
  .filter((page) => Boolean(page.slug))
  .map((page) => ({
    href: `/industries/${page.slug}`,
    label: (page.navLabel as string)?.trim() || (page.title as string),
    linkType: 'custom' as const,
  }))

/*
 * The catalogue's shelves are chosen rather than typed: each row carries the
 * industry, and each link under it the family as well, so the addresses are
 * spelled out from the documents themselves and survive a slug being changed.
 * Industries with nothing under them are left out, as they always were.
 */
const productMenu = rankedIndustries
  .map((industry) => ({
    industry: industry.id,
    label: industry.title as string,
    linkType: 'productCategory' as const,
    links: families.docs
      .filter((family) => relationArrayIncludesSlug(family.industryFocus, industry.slug as string))
      .map((family) => ({
        family: family.id,
        industry: industry.id,
        label: family.title as string,
        linkType: 'productCategory' as const,
      })),
  }))
  .filter((column) => column.links.length > 0)

const navigation = ((header as { navigation?: Record<string, unknown>[] }).navigation ?? []).map(
  (row) => {
    const label = String(row.label ?? '')
      .trim()
      .toLowerCase()

    if (label === 'industries') return { ...row, children: industryMenu }
    if (label === 'products') return { ...row, children: productMenu }

    return row
  },
)

await payload.updateGlobal({ slug: 'header', data: { navigation }, depth: 0 })

console.log(`industries: ${industryMenu.length} entries`)
console.log(
  `products: ${productMenu.length} columns, ${productMenu.reduce((n, c) => n + c.links.length, 0)} links`,
)
process.exit(0)
