import { describe, expect, test, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }))

const { globals } = await import('@/globals')

/*
 * The site reads every global through the cache under the `globals` tag. A
 * Footer saved without clearing it kept showing the old footer -- a newly
 * uploaded locations image among it -- until the server restarted.
 */
describe('globals', () => {
  test('clear the cached site data when saved', async () => {
    expect(globals.map((global) => global.slug)).toContain('footer')

    for (const global of globals) {
      const hooks = global.hooks?.afterChange ?? []
      expect(hooks.length, global.slug).toBeGreaterThan(0)

      revalidateTag.mockClear()
      for (const hook of hooks) await hook({ doc: {} } as never)
      expect(revalidateTag, global.slug).toHaveBeenCalledWith('globals', { expire: 0 })
    }
  })
})
