'use client'

import { useActionState } from 'react'

import { subscribeToNewsletter, type NewsletterState } from '@/actions/newsletter'

const initialState: NewsletterState = { message: '', status: 'idle' }

export function FooterNewsletterForm(props: { buttonLabel: string; placeholder: string }) {
  const { buttonLabel, placeholder } = props
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState)

  return (
    <form action={formAction} className="figma-footer-newsletter-form">
      <label className="sr-only" htmlFor="footer-newsletter-email">
        Email address
      </label>
      <input
        autoComplete="email"
        id="footer-newsletter-email"
        name="email"
        placeholder={placeholder}
        required
        type="email"
      />
      <input aria-hidden="true" className="figma-footer-honeypot" name="website" tabIndex={-1} />
      <button disabled={pending} type="submit">
        {pending ? 'Subscribing…' : buttonLabel}
      </button>
      <p aria-live="polite" className={`figma-footer-form-status is-${state.status}`}>
        {state.message}
      </p>
    </form>
  )
}
