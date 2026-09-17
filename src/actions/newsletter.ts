'use server'

import { z } from 'zod'

import { getPayloadClient } from '@/data/payload'
import { sendSafely } from '@/lib/email/formNotifications'
import { checkForBots } from '@/lib/forms/botGuard'
import { ALL_TOPICS, newToken } from '@/lib/newsletter/config'
import { confirmationEmail } from '@/lib/newsletter/emails'
import { runAfterResponse } from '@/lib/newsletter/runAfter'

export type NewsletterState = {
  message: string
  status: 'idle' | 'error' | 'success'
}

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email())

/** A second confirmation email for the same address waits this long. */
const RESEND_AFTER_MS = 10 * 60 * 1000

const CHECK_INBOX = 'Almost done: check your inbox and click the link to confirm.'

/**
 * The footer's subscribe form, with double opt-in: the address is saved as
 * Pending and emailed a confirmation link, and only once that is clicked
 * does it receive anything else (see /newsletter/confirm).
 *
 * The answer never says whether an address was already on the list beyond
 * "already subscribed", and a pending address is not re-emailed more than
 * once every ten minutes, so the form cannot be used to flood an inbox.
 */
export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const verdict = await checkForBots(formData, { form: 'newsletter', rateLimit: 5 })
  if (verdict.kind === 'silent-drop') return { message: CHECK_INBOX, status: 'success' }
  if (verdict.kind === 'reject') return { message: verdict.message, status: 'error' }

  const parsed = emailSchema.safeParse(formData.get('email') ?? '')
  if (!parsed.success) {
    return { message: 'Please enter a valid email address.', status: 'error' }
  }
  const email = parsed.data

  try {
    const payload = await getPayloadClient()
    const now = new Date()

    const { docs } = await payload.find({
      collection: 'subscribers',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      showHiddenFields: true,
      where: { email: { equals: email } },
    })
    const existing = docs[0]

    if (existing?.status === 'active') {
      return { message: 'You’re already subscribed. Thank you!', status: 'success' }
    }

    let token: string
    if (existing) {
      const lastSent = existing.confirmationSentAt ? new Date(existing.confirmationSentAt).getTime() : 0
      if (existing.status === 'pending' && now.getTime() - lastSent < RESEND_AFTER_MS) {
        return { message: CHECK_INBOX, status: 'success' }
      }
      token = existing.token
      await payload.update({
        collection: 'subscribers',
        data: { confirmationSentAt: now.toISOString(), status: 'pending' },
        id: existing.id,
        overrideAccess: true,
      })
    } else {
      token = newToken()
      await payload.create({
        collection: 'subscribers',
        data: {
          confirmationSentAt: now.toISOString(),
          email,
          source: formData.get('source') === 'site-footer' ? 'site-footer' : 'website',
          status: 'pending',
          token,
          topics: ALL_TOPICS,
        },
        overrideAccess: true,
      })
    }

    runAfterResponse(() => sendSafely(payload, confirmationEmail(email, token)))

    return { message: CHECK_INBOX, status: 'success' }
  } catch (error) {
    console.error('[newsletter] Unable to save subscription', error)
    return { message: 'Something went wrong. Please try again.', status: 'error' }
  }
}
