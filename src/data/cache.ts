import { unstable_cache } from 'next/cache'

/**
 * Wrap a data loader in Next's persistent cache with invalidation tags.
 * Results are cached across requests and busted via `revalidateTag(tag)`.
 * The wrapped loader MUST NOT read cookies()/headers()/draftMode().
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, keyParts, { tags })
}
