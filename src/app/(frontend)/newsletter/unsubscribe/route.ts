import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/data/payload'
import { isToken } from '@/lib/newsletter/config'
import { findByToken, unsubscribe } from '@/lib/newsletter/subscriptions'

export const dynamic = 'force-dynamic'

/**
 * One-click unsubscribe (RFC 8058), named in every newsletter email's
 * List-Unsubscribe header. Gmail and Outlook show their own "Unsubscribe"
 * button and POST here when it is pressed.
 *
 * A GET only redirects to the preferences page. Link scanners in corporate
 * mail systems open every URL in an email, and unsubscribing on a GET would
 * quietly drop those readers from the list.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const payload = await getPayloadClient()
  const subscriber = await findByToken(payload, token)

  if (subscriber) await unsubscribe(payload, subscriber)

  // The same answer either way: whether an address is listed is not the caller's business.
  return new NextResponse(null, { status: 200 })
}

export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const target = new URL('/newsletter/preferences', request.nextUrl.origin)
  if (isToken(token)) target.searchParams.set('token', token)
  target.hash = 'unsubscribe'
  return NextResponse.redirect(target, 303)
}
