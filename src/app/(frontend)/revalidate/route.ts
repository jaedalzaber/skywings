import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

import { TAGS } from '@/data/tags'

export const dynamic = 'force-dynamic'

/** Every top-level cache tag. A per-item tag is always cleared with its collection's tag. */
const ALL_TAGS: string[] = Object.values(TAGS).flatMap((tag) => (typeof tag === 'string' ? [tag] : []))

/**
 * Clears the site's data cache on a running server.
 *
 * Content written by a script -- a seed, an import, a one-off fix -- lands in
 * the database, but the pages read it through `unstable_cache`, which has no
 * expiry and is only cleared by `revalidateTag`. That call needs a request,
 * so a script cannot make it, and until now every such change needed the dev
 * server restarted. `pnpm run refresh:cache` calls this instead.
 *
 * POST, with `Authorization: Bearer $REVALIDATE_SECRET`. Without the secret
 * set it answers in development only, like the newsletter dispatch route.
 * Body `{ "tags": ["industry-pages"] }` clears those; no body clears all.
 */
function authorized(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown }
  const requested = Array.isArray(body.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
    : []
  const tags = requested.length > 0 ? requested : ALL_TAGS

  for (const tag of tags) revalidateTag(tag, { expire: 0 })

  return NextResponse.json({ revalidated: tags })
}
