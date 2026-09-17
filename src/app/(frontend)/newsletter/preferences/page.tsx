import type { Metadata } from 'next'

import { unsubscribeFromNewsletter, updateNewsletterPreferences } from '@/actions/newsletterPreferences'
import { NewsletterPanel } from '@/components/newsletter/NewsletterPanel'
import { getPayloadClient } from '@/data/payload'
import { NEWSLETTER_TOPICS } from '@/lib/newsletter/config'
import { findByToken } from '@/lib/newsletter/subscriptions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Email preferences',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const NOTICES: Record<string, { text: string; tone: 'error' | 'success' }> = {
  invalid: { text: 'That link is not valid any more.', tone: 'error' },
  saved: { text: 'Your preferences are saved.', tone: 'success' },
  unsubscribed: {
    text: 'You are unsubscribed and will not receive any more newsletter emails.',
    tone: 'success',
  },
}

/**
 * Linked from the foot of every newsletter email. Holding the link is what
 * identifies the subscriber, so there is no sign-in: tick topics and save, or
 * unsubscribe from everything. A test email's link ("token=test") explains
 * itself instead of erroring.
 */
export default async function NewsletterPreferencesPage({ searchParams }: Props) {
  const { done, token } = await searchParams

  if (token === 'test') {
    return (
      <NewsletterPanel title="This is a test email link">
        <p className="newsletter-text">
          In a real newsletter email this link opens the subscriber’s own preferences.
        </p>
      </NewsletterPanel>
    )
  }

  const payload = await getPayloadClient()
  const subscriber = await findByToken(payload, token)

  if (!subscriber) {
    return (
      <NewsletterPanel title="This link is not valid" tone="error">
        <p className="newsletter-text">
          Use the “Choose what you receive” link from a recent email from us, or reply to that email
          and we will update your subscription for you.
        </p>
      </NewsletterPanel>
    )
  }

  const notice = typeof done === 'string' ? NOTICES[done] : undefined
  const unsubscribed = subscriber.status === 'unsubscribed'
  const selected = new Set(unsubscribed ? [] : (subscriber.topics ?? []))

  return (
    <NewsletterPanel title="Choose what you receive">
      {notice ? (
        <p className="newsletter-notice" data-tone={notice.tone} role="status">
          {notice.text}
        </p>
      ) : null}

      <p className="newsletter-text">
        Emails go to <strong>{subscriber.email}</strong>.{' '}
        {unsubscribed
          ? 'You are not subscribed at the moment. Tick what you would like and save to subscribe again.'
          : 'Untick anything you would rather not hear about.'}
      </p>

      <form action={updateNewsletterPreferences} className="newsletter-form">
        <input name="token" type="hidden" value={subscriber.token} />
        <fieldset className="newsletter-topics">
          <legend className="sr-only">Topics</legend>
          {NEWSLETTER_TOPICS.map((topic) => (
            <label className="newsletter-topic" key={topic.value}>
              <input
                defaultChecked={selected.has(topic.value)}
                name="topics"
                type="checkbox"
                value={topic.value}
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </fieldset>
        <button className="newsletter-button" type="submit">
          {unsubscribed ? 'Subscribe again' : 'Save preferences'}
        </button>
      </form>

      {unsubscribed ? null : (
        <form action={unsubscribeFromNewsletter} className="newsletter-unsubscribe" id="unsubscribe">
          <input name="token" type="hidden" value={subscriber.token} />
          <p className="newsletter-text">Prefer not to hear from us at all?</p>
          <button className="newsletter-button" data-variant="quiet" type="submit">
            Unsubscribe from all emails
          </button>
        </form>
      )}
    </NewsletterPanel>
  )
}
