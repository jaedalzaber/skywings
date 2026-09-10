import { describe, expect, test } from 'vitest'

import {
  INDUSTRY_FAMILY_FOCUS,
  PRODUCT_FAMILIES,
  REMOVED_FAMILIES,
  SUPERSEDED_FAMILIES,
  familiesForIndustry,
  industriesForFamily,
} from '@/data/productTaxonomy'

const familySlugs = new Set(PRODUCT_FAMILIES.map((family) => family.slug))

describe('product taxonomy', () => {
  test('every focused family exists', () => {
    for (const [industry, families] of Object.entries(INDUSTRY_FAMILY_FOCUS)) {
      for (const family of families) {
        expect(familySlugs, `${industry} focuses on unknown family ${family}`).toContain(family)
      }
    }
  })

  test('family slugs and sort orders are unique', () => {
    expect(familySlugs.size).toBe(PRODUCT_FAMILIES.length)
    expect(new Set(PRODUCT_FAMILIES.map((family) => family.sortOrder)).size).toBe(
      PRODUCT_FAMILIES.length,
    )
  })

  /*
   * The regression this taxonomy exists to fix: the seed gave every
   * non-aviation family the same four industries, so five of the six Products
   * menu columns rendered an identical list.
   */
  test('no two industries render the same menu column', () => {
    const columns = new Map<string, string>()

    for (const industry of Object.keys(INDUSTRY_FAMILY_FOCUS)) {
      const signature = [...familiesForIndustry(industry)].sort().join('|')
      const duplicate = columns.get(signature)

      expect(duplicate, `${industry} lists exactly what ${duplicate} lists`).toBeUndefined()
      columns.set(signature, industry)
    }
  })

  /*
   * Columns render in family `sortOrder`, not in the order written here, so
   * what matters is not which family comes first but that every column holds
   * something the others do not -- otherwise a column is just a subset of its
   * neighbour and carries no information.
   */
  test('every industry column is substantial and has a signature family', () => {
    for (const [industry, families] of Object.entries(INDUSTRY_FAMILY_FOCUS)) {
      expect(families.length, `${industry} has too few families`).toBeGreaterThanOrEqual(4)

      const rarest = Math.min(...families.map((family) => industriesForFamily(family).length))
      expect(rarest, `${industry} shares every family widely`).toBeLessThanOrEqual(2)
    }
  })

  test('no family is orphaned', () => {
    for (const family of PRODUCT_FAMILIES) {
      expect(industriesForFamily(family.slug).length, `${family.slug} is in no menu`).toBeGreaterThan(
        0,
      )
    }
  })

  test('retired families are out of every menu and point at a live successor', () => {
    for (const [retired, successor] of Object.entries(SUPERSEDED_FAMILIES)) {
      expect(familySlugs, `${retired} is still in the taxonomy`).not.toContain(retired)
      expect(familySlugs, `${retired} points at unknown ${successor}`).toContain(successor)
      expect(industriesForFamily(retired)).toHaveLength(0)
    }
  })

  /*
   * Repair, refurbishment and spares are sold as a service and get their own
   * section, so nothing in the product taxonomy may offer them -- neither a
   * family nor an industry column built out of them.
   */
  test('service work stays out of the product taxonomy', () => {
    const serviceWording = /repair|refurb|spare/i

    for (const family of PRODUCT_FAMILIES) {
      expect(family.slug, `${family.slug} sells service work`).not.toMatch(serviceWording)
      expect(family.title, `${family.title} sells service work`).not.toMatch(serviceWording)
      expect(family.summary, `${family.slug} summary sells service work`).not.toMatch(serviceWording)
    }

    for (const removed of REMOVED_FAMILIES) {
      expect(familySlugs, `${removed} is back in the taxonomy`).not.toContain(removed)
      expect(industriesForFamily(removed)).toHaveLength(0)
    }

    expect(Object.keys(INDUSTRY_FAMILY_FOCUS)).not.toContain('maintenance-and-repair-services')
  })

  test('aviation keeps its own families, and shares none with other industries', () => {
    const aviation = familiesForIndustry('aviation-ground-support-equipment')

    expect(aviation.length).toBeGreaterThan(0)
    for (const family of aviation) {
      expect(industriesForFamily(family)).toEqual(['aviation-ground-support-equipment'])
    }
  })
})
