import type { Metadata } from 'next'
import Link from 'next/link'

import { NewsletterPanel } from '@/components/newsletter/NewsletterPanel'
import { getPayloadClient } from '@/data/payload'
import { sendSafely } from '@/lib/email/formNotifications'
import { subscriberConfirmedTeamEmail } from '@/lib/newsletter/emails'
import { runAfterResponse } from '@/lib/newsletter/runAfter'
import { confirmSubscriber, findByToken } from '@/lib/newsletter/subscriptions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Confirm your subscription',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/**
 * Where the confirmation email's button lands. Opening the link is the
 * confirmation: it turns a Pending subscriber Active and tells the team.
 */
export default async function ConfirmSubscriptionPage({ searchParams }: Props) {
  const { token } = await searchParams
  const payload = await getPayloadClient()
  const subscriber = await findByToken(payload, token)

  if (!subscriber) {
    return (
      <NewsletterPanel title="This link is not valid" tone="error">
        <p className="newsletter-text">
          The confirmation link may be incomplete or out of date. Subscribe again from the form at
          the bottom of any page and we will send you a fresh one.
        </p>
      </NewsletterPanel>
    )
  }

  const newlyConfirmed = await confirmSubscriber(payload, subscriber)
  if (newlyConfirmed) {
    runAfterResponse(() => sendSafely(payload, subscriberConfirmedTeamEmail(subscriber.email)))
  }

  return (
    <NewsletterPanel title="You’re subscribed" tone="success">
      <p className="newsletter-text">
        Thank you. <strong>{subscriber.email}</strong> will now receive new articles, product
        launches and company news from Sky Wings.
      </p>
      <p className="newsletter-text">
        Want only some of these?{' '}
        <Link href={`/newsletter/preferences?token=${subscriber.token}`}>Choose what you receive</Link>
        .
      </p>
    </NewsletterPanel>
  )
}
