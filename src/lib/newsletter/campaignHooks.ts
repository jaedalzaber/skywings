import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'

import { sendSafely } from '../email/formNotifications'
import { contentOf, kickDispatch } from './dispatch'
import { campaignEmail } from './emails'
import { runAfterResponse } from './runAfter'

/** Statuses only the sender sets; an editor picking one would skip or repeat sends. */
const SYSTEM_STATUSES = ['sending', 'paused', 'sent']

/**
 * What an editor may do with a campaign's status: start one, stop one, and
 * resume a stopped one. The sender's own progress updates pass
 * `context.newsletterSystem` and skip these rules.
 */
export const beforeCampaignChange: CollectionBeforeChangeHook = ({ context, data, originalDoc }) => {
  if (context.newsletterSystem) return data

  const previous = (originalDoc?.status as string | undefined) ?? 'draft'
  const next = (data.status as string | undefined) ?? previous

  if (previous === 'sent' && next !== 'sent') {
    throw new APIError(
      'This email has already been sent. Duplicate it to send a new version.',
      400,
      undefined,
      true,
    )
  }
  if (SYSTEM_STATUSES.includes(next) && next !== previous) {
    throw new APIError(
      'That status is set automatically while sending. Choose "Send now" to start, or "Cancelled" to stop.',
      400,
      undefined,
      true,
    )
  }

  if (next === 'queued' && previous !== 'queued') {
    data.queuedAt = new Date().toISOString()
    data.lockedUntil = null
  }

  return data
}

export const afterCampaignChange: CollectionAfterChangeHook = ({ context, doc, previousDoc, req }) => {
  if (context.newsletterSystem) return doc

  const payload = req.payload

  // A test copy: same email, links that only open the preferences page's notice.
  if (doc.testRecipient && doc.testRecipient !== previousDoc?.testRecipient) {
    runAfterResponse(async () => {
      const full = await payload.findByID({
        collection: 'newsletter-campaigns',
        depth: 1,
        id: doc.id,
        overrideAccess: true,
      })
      const email = campaignEmail(contentOf(full as never), {
        email: doc.testRecipient,
        token: 'test',
      })
      await sendSafely(payload, { ...email, subject: `[Test] ${email.subject}` })
    })
  }

  if (doc.status === 'queued' && previousDoc?.status !== 'queued') {
    runAfterResponse(kickDispatch)
  }

  return doc
}
