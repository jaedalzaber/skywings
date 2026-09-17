'use server'

import { redirect } from 'next/navigation'

import { getPayloadClient } from '@/data/payload'
import { isToken } from '@/lib/newsletter/config'
import { findByToken, savePreferences, unsubscribe } from '@/lib/newsletter/subscriptions'

/*
 * The preferences page's two buttons. Both post the token from the page's
 * link and come back to the same page with the outcome in the query, so the
 * page works without JavaScript and a refresh does not resubmit.
 */

function backTo(token: unknown, outcome: string) {
  const safe = isToken(token) ? token : ''
  return `/newsletter/preferences?token=${safe}&done=${outcome}`
}

export async function updateNewsletterPreferences(formData: FormData) {
  const token = formData.get('token')
  const payload = await getPayloadClient()
  const subscriber = await findByToken(payload, token)
  if (!subscriber) redirect(backTo(token, 'invalid'))

  const result = await savePreferences(payload, subscriber, formData.getAll('topics'))
  redirect(backTo(token, result.unsubscribed ? 'unsubscribed' : 'saved'))
}

export async function unsubscribeFromNewsletter(formData: FormData) {
  const token = formData.get('token')
  const payload = await getPayloadClient()
  const subscriber = await findByToken(payload, token)
  if (!subscriber) redirect(backTo(token, 'invalid'))

  await unsubscribe(payload, subscriber)
  redirect(backTo(token, 'unsubscribed'))
}
