import { describe, expect, test } from 'vitest'

import {
  buildSearchIndex,
  compactCode,
  editDistance,
  normalizeText,
  searchIndex,
  suggestQuery,
  type SearchFields,
} from '@/lib/search/productSearch'

type Doc = { id: string; fields: SearchFields }

const doc = (id: string, fields: Partial<SearchFields> & { title: string }): Doc => ({
  fields: { code: null, context: '', family: '', summary: '', ...fields },
  id,
})

const catalogue: Doc[] = [
  doc('folding-stand', {
    code: 'GSE-FS-038',
    context: 'Aviation Ground Support Equipment Welding & Assembly',
    family: 'Access & Maintenance Equipment',
    summary: 'Foldable work stand for aircraft maintenance.',
    title: 'Folding Stand',
  }),
  doc('fs-039', {
    code: 'GSE-FS-039',
    family: 'Access & Maintenance Equipment',
    title: 'Folding Stand Extended',
  }),
  doc('open-baggage-cart', {
    code: 'GSE-OBC-021',
    context: 'Powder coating',
    family: 'Cargo & Baggage Handling',
    summary: 'Open-sided cart for loose baggage.',
    title: 'Open Baggage Cart',
  }),
  doc('mail-cart', {
    code: 'GSE-CMC-019',
    family: 'Cargo & Baggage Handling',
    title: 'Cargo Mail Cart',
  }),
  doc('tire-trolley', {
    code: 'GSE-TT-044',
    family: 'Engine, Lifting & Servicing',
    title: 'Tire Trolley with Hydraulic Lift',
  }),
  doc('handrails', {
    code: 'SW-TB-001',
    context: 'Aluminium Stainless steel',
    family: 'Tubular Products',
    summary: 'Galvanised steel handrails and safety barriers.',
    title: 'Handrails And Safety Barriers',
  }),
  doc('summary-only', {
    code: 'SW-XX-900',
    family: 'Sheet Metal Products',
    summary: 'Covers that fold away for storage.',
    title: 'Equipment Enclosure',
  }),
]

const index = buildSearchIndex(catalogue, (item) => item.fields)
const ids = (query: string) => searchIndex(index, query).map(({ item }) => item.id)

describe('product search', () => {
  /*
   * A buyer quoting a model number types it however it is in front of them:
   * off a drawing, a nameplate, an old email. All of these are the same code.
   */
  test('finds a model number however it is punctuated or spaced', () => {
    for (const query of ['GSE-FS-038', 'gse fs 038', 'FS038', 'fs-038', 'gsefs038', ' GSE FS-038 ']) {
      expect(ids(query)[0], query).toBe('folding-stand')
    }
    expect(compactCode('GSE-FS-038')).toBe('gsefs038')
  })

  test('puts the exact model number first, ahead of near neighbours', () => {
    const results = ids('GSE-FS-038')

    expect(results[0]).toBe('folding-stand')
    // One digit off is a different product, never a typo.
    expect(results).not.toContain('fs-039')
    expect(ids('GSE-FS-039')).toEqual(['fs-039'])
  })

  test('matches every word, in any order', () => {
    expect(ids('cart baggage open')).toEqual(['open-baggage-cart'])
    expect(ids('baggage cart')[0]).toBe('open-baggage-cart')
    // Every word has to land somewhere: "submarine" is nowhere.
    expect(ids('baggage submarine')).toEqual([])
    // Filler words do not have to.
    expect(ids('cart for baggage')[0]).toBe('open-baggage-cart')
  })

  test('forgives plurals and small typos, but not in short words', () => {
    expect(ids('carts')).toContain('mail-cart')
    expect(ids('handrail')).toEqual(['handrails'])
    expect(ids('baggae')).toContain('open-baggage-cart')
    expect(ids('hydraulc')).toEqual(['tire-trolley'])
    // Four letters one off is usually another word: "card" is not "cart".
    expect(ids('card')).toEqual([])
  })

  test('reads trade spellings and shorthands as the same thing', () => {
    expect(ids('aluminum')).toEqual(['handrails'])
    expect(ids('galvanized')).toEqual(['handrails'])
    expect(ids('gse')).toContain('folding-stand')
    // Cart and trolley are the same kit on an apron.
    expect(ids('trolley')).toEqual(expect.arrayContaining(['tire-trolley', 'mail-cart']))
    expect(ids('trolley')[0]).toBe('tire-trolley')
  })

  /*
   * Where a word lands decides the order: the name first, then the family,
   * then the context, then a passing mention in a summary.
   */
  test('ranks a name above a family, and a family above a summary', () => {
    expect(ids('fold')).toEqual(['folding-stand', 'fs-039', 'summary-only'])
    expect(ids('baggage')[0]).toBe('open-baggage-cart')
  })

  test('offers a corrected spelling only when it finds something', () => {
    expect(suggestQuery(index, 'hnadrails')).toBe('handrails')
    expect(suggestQuery(index, 'bagagge crat')).toBe('baggage cart')
    // Model numbers are never "corrected" into a different product.
    expect(suggestQuery(index, 'GSE-FS-099')).toBeNull()
    expect(suggestQuery(index, 'zzzzzz')).toBeNull()
  })

  test('counts a swap of two letters as one slip', () => {
    expect(editDistance('trolely', 'trolley')).toBe(1)
    expect(editDistance('stand', 'stnad')).toBe(1)
    expect(editDistance('cart', 'cart')).toBe(0)
    // Gives up past the limit rather than measuring the whole way.
    expect(editDistance('handrails', 'conveyor', 2)).toBe(3)
  })

  test('folds case, accents and ampersands before comparing', () => {
    expect(normalizeText('Cargo & Baggage  Handling')).toBe('cargo and baggage handling')
    expect(normalizeText('Café-Trolley')).toBe('cafe trolley')
  })

  test('returns everything, unranked, for a query of only filler', () => {
    expect(searchIndex(index, 'the and')).toHaveLength(catalogue.length)
  })
})
