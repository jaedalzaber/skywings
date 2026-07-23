import { describe, expect, test, vi } from 'vitest'

vi.mock('next/cache', () => ({
  // Identity wrapper so we can test cachedQuery's pass-through deterministically.
  unstable_cache: (fn: unknown) => fn,
}))

import { cachedQuery } from '@/data/cache'
import { TAGS } from '@/data/tags'

describe('TAGS', () => {
  test('static tags are stable strings', () => {
    expect(TAGS.products).toBe('products')
    expect(TAGS.media).toBe('media')
    expect(TAGS.globals).toBe('globals')
    expect(TAGS.threeD).toBe('three-d')
  })

  test('entity tag builders namespace by slug', () => {
    expect(TAGS.product('folding-stand')).toBe('product:folding-stand')
    expect(TAGS.post('hello-world')).toBe('post:hello-world')
    expect(TAGS.page('home')).toBe('page:home')
  })
})

describe('cachedQuery', () => {
  test('returns a function that yields the loader result', async () => {
    const wrapped = cachedQuery(async (n: number) => n * 2, ['double'], [TAGS.products])
    expect(await wrapped(21)).toBe(42)
  })
})
