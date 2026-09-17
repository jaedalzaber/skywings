import { after, NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/data/payload'
import { dispatchNewsletters, kickDispatch } from '@/lib/newsletter/dispatch'

export const dynamic = 'force-dynamic'
/** The response goes at once; sending carries on after it for up to this long. */
export const maxDuration = 60

/**
 * Runs a newsletter sending pass. Called three ways:
 *
 * - when an editor queues a campaign (or a publish queues one),
 * - by itself, when a pass runs out of time with emails still to send,
 * - by Vercel Cron once a day (vercel.json), which resumes anything paused
 *   by the daily limit and catches a run that never started.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; so do the other two
 * callers. Without CRON_SECRET the route is open in development only.
 */
function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  after(async () => {
    const payload = await getPayloadClient()
    const result = await dispatchNewsletters(payload, { budgetMs: 45_000 })
    payload.logger.info(
      `[newsletter] Sent ${result.sent}; stopped: ${result.stoppedBy}; more waiting: ${result.remaining}`,
    )
    // Out of time with work left: hand over to a fresh run. A daily-limit
    // stop waits for tomorrow's cron instead.
    if (result.stoppedBy === 'time-budget' && result.remaining) await kickDispatch()
  })

  return NextResponse.json({ started: true }, { status: 202 })
}
