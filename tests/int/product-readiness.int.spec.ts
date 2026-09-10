import { describe, expect, test } from 'vitest'

import { compareTitles, hasProductPage, pagesFirst } from '@/data/productReadiness'
import type { Product } from '@/payload-types'

const paragraph = (text: string) =>
  ({
    root: { children: [{ children: [{ text, type: 'text' }], type: 'paragraph' }] },
  }) as unknown as Product['description']

const photo = [{ id: 'g1', image: 12 }] as Product['gallery']

/*
 * A product gets a page -- a card that links, a place at the front -- once it
 * has what the page is built from: photographs and a written description.
 */
describe('product readiness', () => {
  test('needs both a gallery photograph and a written description', () => {
    expect(hasProductPage({ description: paragraph('A stand.'), gallery: photo })).toBe(true)
    expect(hasProductPage({ description: paragraph('A stand.'), gallery: [] })).toBe(false)
    expect(hasProductPage({ description: null, gallery: photo })).toBe(false)
  })

  // An editor who clears the text leaves an empty paragraph behind.
  test('does not count an empty description as written', () => {
    expect(hasProductPage({ description: paragraph('   '), gallery: photo })).toBe(false)
  })

  test('puts products with a page first and keeps each group in order', () => {
    const items = [
      { name: 'a', page: false },
      { name: 'b', page: true },
      { name: 'c', page: false },
      { name: 'd', page: true },
    ]
    expect(pagesFirst(items, (item) => item.page).map((item) => item.name)).toEqual([
      'b',
      'd',
      'a',
      'c',
    ])
  })

  test('compares the numbers in names as numbers', () => {
    expect(['LD11', 'LD2', 'LD1'].sort(compareTitles)).toEqual(['LD1', 'LD2', 'LD11'])
  })
})
