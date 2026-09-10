import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { INDUSTRY_PRIORITY, industryRank } from '@/data/productTaxonomy'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

/*
 * Aviation ground support is the range Sky Wings leads with, so it leads
 * everywhere -- the Products menu, the catalogue sidebar, the landing page,
 * the industry index -- rather than in whichever surface last remembered to
 * sort for itself. One list, applied where industries are read.
 */
describe('industry priority', () => {
  test('pins aviation, and leaves the editor ordering underneath it', () => {
    expect(INDUSTRY_PRIORITY[0]).toBe('aviation-ground-support-equipment')
    expect(industryRank('aviation-ground-support-equipment')).toBe(0)
    // Everything unpinned shares the last rank, so a stable sort keeps
    // sortOrder intact among them.
    expect(industryRank('industrial-manufacturing')).toBe(INDUSTRY_PRIORITY.length)
    expect(industryRank('construction-and-infrastructure')).toBe(
      industryRank('custom-metal-fabrication'),
    )

    const ordered = [
      { slug: 'construction-and-infrastructure' },
      { slug: 'industrial-manufacturing' },
      { slug: 'aviation-ground-support-equipment' },
    ].sort((a, b) => industryRank(a.slug) - industryRank(b.slug))
    expect(ordered.map((item) => item.slug)).toEqual([
      'aviation-ground-support-equipment',
      'construction-and-infrastructure',
      'industrial-manufacturing',
    ])
  })

  test('is applied where industries are read, not per surface', () => {
    const catalog = read('src/data/catalog.ts')
    const home = read('src/data/home.ts')

    // The one query every listing goes through.
    expect(catalog).toMatch(
      /sort: 'sortOrder',\s*\}\)\s*\n\s*\/\/[^\n]*\n\s*return \[\.\.\.docs\]\.sort\(\(a, b\) => industryRank\(a\.slug\) - industryRank\(b\.slug\)\)/,
    )
    // The Products menu no longer ranks for itself; it inherits the order.
    expect(catalog).not.toMatch(/PRODUCT_MENU_PRIORITY|menuRank/)

    // The landing page reads past its own limit, so a pinned industry cannot
    // be cut off before the priority is applied.
    expect(home).toMatch(/industryRank\(a\.slug\) - industryRank\(b\.slug\)/)
    expect(home).toMatch(/\.slice\(0, HOME_INDUSTRY_LIMIT\)/)
    expect(home).not.toMatch(/limit: HOME_INDUSTRY_LIMIT/)

    // And the hero's own list of sectors leads with it too.
    expect(read('src/components/home/HomeBlocks.tsx')).toMatch(
      /const heroServices = \[\s*'Aviation Ground Support Equipment',/,
    )
  })

  /*
   * The Industries menu is hand-curated in the CMS, so its order is data, not
   * derived. The priority is a standing decision about the range rather than a
   * layout preference, so it settles that order too -- for the curated list as
   * well as the generated one, keyed on the slug rather than the position.
   */
  test('orders the Industries menu whether it is curated or generated', () => {
    const site = read('src/data/site.ts')

    expect(site).toMatch(/function sortIndustryChildren\(children: HeaderNavigationChild\[\]\)/)
    expect(site).toMatch(/href\.split\('\/industries\/'\)\[1\]/)
    // The curated branch used to return untouched; it now keeps its content
    // and gives up only its order.
    expect(site).toMatch(
      /if \(\(item\.children\?\.length \?\? 0\) > 1\) \{\s*return label === 'industries'\s*\? \{ \.\.\.item, children: sortIndustryChildren\(item\.children \?\? \[\]\) \}\s*: item/,
    )
    // And the generated branch sorts the same way.
    expect(site).toMatch(/children: sortIndustryChildren\(\s*industryPages\.length/)
  })
})
