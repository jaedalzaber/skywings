import type { Payload } from 'payload'

import type { Subscriber } from '@/payload-types'

import { isToken, isTopic, type NewsletterTopic } from './config'

/**
 * A subscriber looked up by the private token from their email. The token
 * is the only proof of who is asking, so anything malformed is treated the
 * same as not found.
 */
export async function findByToken(payload: Payload, token: unknown): Promise<Subscriber | null> {
  if (!isToken(token)) return null
  const { docs } = await payload.find({
    collection: 'subscribers',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: { token: { equals: token } },
  })
  return docs[0] ?? null
}

/** Pending to Active. Returns whether this call did it, for the team's note. */
export async function confirmSubscriber(payload: Payload, subscriber: Subscriber) {
  if (subscriber.status === 'active') return false
  await payload.update({
    collection: 'subscribers',
    data: { confirmedAt: new Date().toISOString(), status: 'active', unsubscribedAt: null },
    id: subscriber.id,
    overrideAccess: true,
  })
  return true
}

export async function unsubscribe(payload: Payload, subscriber: Subscriber) {
  if (subscriber.status === 'unsubscribed') return
  await payload.update({
    collection: 'subscribers',
    data: { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() },
    id: subscriber.id,
    overrideAccess: true,
  })
}

/**
 * Saves the topics a subscriber ticked. Holding the emailed link proves they
 * own the address, so saving also confirms a pending or lapsed subscription.
 * Ticking nothing is the same as unsubscribing.
 */
export async function savePreferences(payload: Payload, subscriber: Subscriber, raw: unknown[]) {
  const topics = [...new Set(raw.filter(isTopic))] as NewsletterTopic[]
  if (topics.length === 0) {
    await unsubscribe(payload, subscriber)
    return { topics, unsubscribed: true }
  }

  await payload.update({
    collection: 'subscribers',
    data: {
      ...(subscriber.status === 'active'
        ? {}
        : { confirmedAt: subscriber.confirmedAt ?? new Date().toISOString(), status: 'active' }),
      topics,
      unsubscribedAt: null,
    },
    id: subscriber.id,
    overrideAccess: true,
  })
  return { topics, unsubscribed: false }
}
