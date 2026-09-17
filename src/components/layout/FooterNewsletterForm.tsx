'use client'

import { useActionState, useEffect, useState } from 'react'

import { subscribeToNewsletter, type NewsletterState } from '@/actions/newsletter'
import { useStartedAt } from '@/components/forms/useStartedAt'

const initialState: NewsletterState = { message: '', status: 'idle' }

/**
 * The footer's subscribe form. The address is saved to Newsletter ->
 * Subscribers and sent a confirmation link; see src/actions/newsletter.ts.
 * The honeypot and fill-time stamp keep scripts out without a challenge
 * widget on every page.
 */
export function FooterNewsletterForm(props: { buttonLabel: string; placeholder: string }) {
  const { buttonLabel, placeholder } = props
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState)
  const [attempt, setAttempt] = useState(0)
  const startedAt = useStartedAt(attempt)

  // A fresh clock after each answer, so a second address can be sent.
  useEffect(() => {
    if (state !== initialState) setAttempt((count) => count + 1)
  }, [state])

  return (
    <form action={formAction} className="figma-footer-newsletter-form">
      <label className="sr-only" htmlFor="footer-newsletter-email">
        Email address
      </label>
      <input
        aria-describedby={state.message ? 'footer-newsletter-status' : undefined}
        aria-invalid={state.status === 'error' || undefined}
        autoComplete="email"
        id="footer-newsletter-email"
        maxLength={254}
        name="email"
        placeholder={placeholder}
        required
        type="email"
      />
      <input name="startedAt" type="hidden" value={startedAt} />
      <input name="source" type="hidden" value="site-footer" />
      <input
        aria-hidden="true"
        autoComplete="off"
        className="figma-footer-honeypot"
        name="website"
        tabIndex={-1}
      />
      <button aria-busy={pending} disabled={pending} type="submit">
        {pending ? 'Subscribing…' : buttonLabel}
      </button>
      <p
        aria-live="polite"
        className={`figma-footer-form-status is-${state.status}`}
        id="footer-newsletter-status"
      >
        {state.message}
      </p>
    </form>
  )
}
