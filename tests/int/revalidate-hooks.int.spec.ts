import { afterEach, describe, expect, test, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => revalidateTag(t) }))

import {
  makeCollectionRevalidateHooks,
  makeGlobalRevalidateHook,
} from '@/collections/hooks/revalidate'

afterEach(() => revalidateTag.mockReset())

describe('makeCollectionRevalidateHooks', () => {
  test('afterChange revalidates built tags and returns the doc', async () => {
    const { afterChange } = makeCollectionRevalidateHooks((doc: { slug?: string }) => [
      'products',
      `product:${doc.slug}`,
    ])
    const doc = { slug: 'folding-stand' }
    const result = await (afterChange as any)({ doc })

    expect(revalidateTag).toHaveBeenCalledWith('products')
    expect(revalidateTag).toHaveBeenCalledWith('product:folding-stand')
    expect(result).toBe(doc)
  })

  test('afterDelete revalidates built tags too', async () => {
    const { afterDelete } = makeCollectionRevalidateHooks(() => ['brochures'])
    await (afterDelete as any)({ doc: { id: 1 } })
    expect(revalidateTag).toHaveBeenCalledWith('brochures')
  })
})

describe('makeGlobalRevalidateHook', () => {
  test('afterChange revalidates the static tags and returns the doc', async () => {
    const hook = makeGlobalRevalidateHook(['globals'])
    const doc = { id: 1 }
    const result = await (hook as any)({ doc })
    expect(revalidateTag).toHaveBeenCalledWith('globals')
    expect(result).toBe(doc)
  })
})
