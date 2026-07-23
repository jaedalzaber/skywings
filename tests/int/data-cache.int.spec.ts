import { describe, expect, test, vi } from 'vitest'

// vi.hoisted keeps the spy defined before vi.mock's factory runs (the factory is
// hoisted above module top). The spy passes through to the real loader so we can
// both assert forwarding and exercise the returned function.
const { unstableCache } = vi.hoisted(() => ({
  unstableCache: vi.fn((...args: unknown[]) => args[0]),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (...args: unknown[]) => unstableCache(...args),
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

  test('forwards the loader, keyParts, and tags to unstable_cache', () => {
    const loader = async (n: number) => n * 2
    cachedQuery(loader, ['double'], [TAGS.products, TAGS.media])
    expect(unstableCache).toHaveBeenCalledWith(loader, ['double'], {
      tags: [TAGS.products, TAGS.media],
    })
  })
})
