import { afterEach, describe, expect, test, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (tag: string, profile: { expire: number }) => revalidateTag(tag, profile),
}))

import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Products } from '@/collections/Products'
import { Industries } from '@/collections/Industries'
import {
  makeCollectionRevalidateHooks,
  makeGlobalRevalidateHook,
} from '@/collections/hooks/revalidate'

afterEach(() => revalidateTag.mockReset())

describe('makeCollectionRevalidateHooks', () => {
  test('Pages invalidates the page collection and changed page slug', async () => {
    const afterChange = Pages.hooks?.afterChange?.[0]

    expect(afterChange).toBeTypeOf('function')
    await (afterChange as any)({ doc: { slug: 'home' } })

    expect(revalidateTag).toHaveBeenCalledWith('pages', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('page:home', { expire: 0 })
  })

  test('Media invalidates cached image consumers', async () => {
    const afterChange = Media.hooks?.afterChange?.[0]

    expect(afterChange).toBeTypeOf('function')
    await (afterChange as any)({ doc: { id: 7 } })

    expect(revalidateTag).toHaveBeenCalledWith('media', { expire: 0 })
  })

  test('Products invalidates product listings and changed product slug', async () => {
    const afterChange = Products.hooks?.afterChange?.[0]

    expect(afterChange).toBeTypeOf('function')
    await (afterChange as any)({ doc: { slug: 'folding-stand' } })

    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('product:folding-stand', { expire: 0 })
  })

  test('Industries invalidates industry listings and the synced home section', async () => {
    const afterChange = Industries.hooks?.afterChange?.[0]

    expect(afterChange).toBeTypeOf('function')
    await (afterChange as any)({ doc: { slug: 'construction-infrastructure' } })

    expect(revalidateTag).toHaveBeenCalledWith('industries', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('page:home', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('page:industries/construction-infrastructure', {
      expire: 0,
    })
  })

  test('afterChange revalidates built tags and returns the doc', async () => {
    const { afterChange } = makeCollectionRevalidateHooks((doc: { slug?: string }) => [
      'products',
      `product:${doc.slug}`,
    ])
    const doc = { slug: 'folding-stand' }
    const result = await (afterChange[0] as any)({ doc })

    expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith('product:folding-stand', { expire: 0 })
    expect(result).toBe(doc)
  })

  test('afterDelete revalidates built tags too', async () => {
    const { afterDelete } = makeCollectionRevalidateHooks(() => ['brochures'])
    await (afterDelete[0] as any)({ doc: { id: 1 } })
    expect(revalidateTag).toHaveBeenCalledWith('brochures', { expire: 0 })
  })
})

describe('makeGlobalRevalidateHook', () => {
  test('afterChange revalidates the static tags and returns the doc', async () => {
    const hook = makeGlobalRevalidateHook(['globals'])
    const doc = { id: 1 }
    const result = await (hook as any)({ doc })
    expect(revalidateTag).toHaveBeenCalledWith('globals', { expire: 0 })
    expect(result).toBe(doc)
  })
})
