import { unstable_cache } from 'next/cache'

import { mediaDeliveryCacheKey } from '@/storage/localDelivery'

/**
 * Wrap a data loader in Next's persistent cache with invalidation tags.
 * Results are cached across requests and busted via `revalidateTag(tag)`.
 * The wrapped loader MUST NOT read cookies()/headers()/draftMode().
 *
 * Every key also carries the media delivery fingerprint, since cached results
 * embed media URLs that change when files move between Cloudinary and public/.
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, [...keyParts, mediaDeliveryCacheKey], { tags })
}
