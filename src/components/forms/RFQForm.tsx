'use client'

import 'react-international-phone/style.css'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { PhoneInput } from 'react-international-phone'

import { submitRFQ, type RFQField, type RFQState } from '@/actions/rfq'
import { checkPhone, isDialCodeOnly } from '@/lib/forms/phone'

import {
  describeTurnstileError,
  Turnstile,
  turnstileEnabled,
  type TurnstileStatus,
} from './Turnstile'
import { useStartedAt } from './useStartedAt'

const initialState: RFQState = { fieldErrors: {}, message: '', status: 'idle', values: {} }

/** The Gulf first, then the markets enquiries most often come from. */
const PREFERRED_COUNTRIES = ['ae', 'sa', 'om', 'qa', 'kw', 'bh', 'in', 'gb', 'us']

function Required() {
  return <em aria-hidden="true">*</em>
}

function FieldError(props: { id: string; message?: string }) {
  if (!props.message) return null
  return (
    <p className="rfq-field-error" id={props.id}>
      {props.message}
    </p>
  )
}

/**
 * The enquiry form: what the sender needs, then who they are. Each one is
 * saved as an RFQ in the admin (Sales -> RFQs) and emailed to the team, with
 * an acknowledgement to the sender; see src/actions/rfq.ts.
 *
 * The browser checks the fields first, including the phone number against
 * its country's rules, and the server checks everything again. A refused
 * form comes back filled in, with the problem named under each field.
 *
 * `submitted` and `error` still honour the older ?submitted=1 / ?error=1
 * links, so a bookmarked confirmation reads as it did.
 */
export function RFQForm(props: {
  error?: boolean
  productInterest?: string
  sourcePage: string
  submitted?: boolean
}) {
  const { productInterest, sourcePage } = props
  const [state, formAction, pending] = useActionState(submitRFQ, initialState)
  const [phone, setPhone] = useState('')
  const [dialCode, setDialCode] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const [verification, setVerification] = useState<TurnstileStatus>(() =>
    turnstileEnabled() ? { kind: 'loading' } : { kind: 'disabled' },
  )
  // A problem caught before sending, shown in the same notice as the server's.
  const [clientNotice, setClientNotice] = useState<string>()
  const startedAt = useStartedAt(attempt)
  const wrapper = useRef<HTMLDivElement>(null)

  // After every answer from the server: restart the fill-time clock, take a
  // fresh Turnstile token, and bring the outcome into view.
  useEffect(() => {
    if (state === initialState) return
    setAttempt((count) => count + 1)
    setClientNotice(undefined)
    if (state.status === 'success') {
      setPhone('')
      setPhoneError(undefined)
    }
    wrapper.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [state])

  const errors: Partial<Record<RFQField, string>> = {
    ...state.fieldErrors,
    ...(phoneError ? { phone: phoneError } : {}),
  }
  const values = state.values
  // What posts: nothing when only the country's dial code is showing.
  const postedPhone = isDialCodeOnly(phone, dialCode) ? '' : phone

  const showSuccess = state.status === 'success' || (state.status === 'idle' && props.submitted)
  const showError =
    Boolean(clientNotice) || state.status === 'error' || (state.status === 'idle' && props.error)

  const described = (field: RFQField) =>
    errors[field] ? { 'aria-describedby': `rfq-${field}-error`, 'aria-invalid': true } : {}

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const check = checkPhone(postedPhone)
    if (!check.ok) {
      event.preventDefault()
      setPhoneError(check.message)
      document.getElementById('rfq-phone')?.focus()
      return
    }

    // Invisible Turnstile gives no sign of trouble on its own; say it here
    // rather than send a form the server is bound to refuse.
    if (verification.kind === 'error') {
      event.preventDefault()
      setClientNotice(describeTurnstileError(verification.code))
    } else if (verification.kind === 'loading' || verification.kind === 'expired') {
      event.preventDefault()
      setClientNotice('The security check is still running. Please wait a moment and send again.')
    }
  }

  function onVerification(status: TurnstileStatus) {
    setVerification(status)
    if (status.kind === 'ready') setClientNotice(undefined)
  }

  return (
    <div className="rfq-form" id="rfq-form" ref={wrapper}>
      {showSuccess ? (
        <div className="rfq-form-notice" data-kind="success" role="status">
          <strong>Thank you, your enquiry is with our team.</strong>
          <p>
            An engineer will review it and reply by email or phone, usually within one
            working day.
            {state.reference ? (
              <>
                {' '}
                Your reference is <b>{state.reference}</b>.
              </>
            ) : null}
          </p>
        </div>
      ) : null}
      {showError ? (
        <div className="rfq-form-notice" data-kind="error" role="alert">
          <strong>Your enquiry was not sent.</strong>
          <p>
            {clientNotice ||
              state.message ||
              'Please add your name, a valid email and a short description of what you need.'}
          </p>
        </div>
      ) : null}

      <form action={formAction} onSubmit={onSubmit}>
        <input name="sourcePage" type="hidden" value={sourcePage} />
        <input name="startedAt" type="hidden" value={startedAt} />
        <input name="phone" type="hidden" value={postedPhone} />
        {productInterest ? (
          <input name="productInterest" type="hidden" value={productInterest} />
        ) : null}

        {/* Hidden from people and from assistive technology; bots fill it. */}
        <div aria-hidden="true" className="rfq-form-trap">
          <label>
            Website
            <input autoComplete="off" name="website" tabIndex={-1} />
          </label>
        </div>

        <fieldset className="rfq-form-group">
          <legend>Your project</legend>
          {productInterest ? (
            <p className="rfq-form-product">
              <span>Enquiring about</span> {productInterest}
            </p>
          ) : null}
          <div className="rfq-slot">
            <label className="rfq-field" data-invalid={Boolean(errors.message)}>
              <span>
                <Required /> What do you need made?
              </span>
              <textarea
                defaultValue={values.message}
                maxLength={5000}
                minLength={10}
                name="message"
                placeholder="For example: 20 baggage trolleys, 1,500 kg capacity, powder-coated, delivered to Dubai by June. Add sizes, materials and drawings if you have them."
                required
                rows={5}
                {...described('message')}
              />
            </label>
            <FieldError id="rfq-message-error" message={errors.message} />
          </div>
        </fieldset>

        <fieldset className="rfq-form-group">
          <legend>Your details</legend>
          <div className="rfq-form-row">
            <div className="rfq-slot">
              <label className="rfq-field" data-invalid={Boolean(errors.buyerName)}>
                <span>
                  <Required /> Name
                </span>
                <input
                  autoComplete="name"
                  defaultValue={values.buyerName}
                  maxLength={120}
                  minLength={2}
                  name="buyerName"
                  required
                  {...described('buyerName')}
                />
              </label>
              <FieldError id="rfq-buyerName-error" message={errors.buyerName} />
            </div>
            <div className="rfq-slot">
              <label className="rfq-field" data-invalid={Boolean(errors.company)}>
                <span>Company</span>
                <input
                  autoComplete="organization"
                  defaultValue={values.company}
                  maxLength={160}
                  name="company"
                  {...described('company')}
                />
              </label>
              <FieldError id="rfq-company-error" message={errors.company} />
            </div>
          </div>
          <div className="rfq-form-row">
            <div className="rfq-slot">
              <label className="rfq-field" data-invalid={Boolean(errors.email)}>
                <span>
                  <Required /> Email
                </span>
                <input
                  autoComplete="email"
                  defaultValue={values.email}
                  maxLength={254}
                  name="email"
                  required
                  type="email"
                  {...described('email')}
                />
              </label>
              <FieldError id="rfq-email-error" message={errors.email} />
            </div>
            <div className="rfq-slot">
              {/*
               * A div, not a label: the country picker is a button, and a label
               * around it would open the dropdown on any click in the box.
               */}
              <div className="rfq-field rfq-field--phone" data-invalid={Boolean(errors.phone)}>
                <label htmlFor="rfq-phone">Phone</label>
                <PhoneInput
                  className="rfq-phone"
                  defaultCountry="ae"
                  inputProps={{
                    autoComplete: 'tel',
                    id: 'rfq-phone',
                    ...described('phone'),
                  }}
                  onBlur={() => {
                    const check = checkPhone(postedPhone)
                    setPhoneError(check.ok ? undefined : check.message)
                  }}
                  onChange={(value, { country }) => {
                    setPhone(value)
                    setDialCode(country.dialCode)
                    const next = isDialCodeOnly(value, country.dialCode) ? '' : value
                    if (phoneError && checkPhone(next).ok) setPhoneError(undefined)
                  }}
                  preferredCountries={PREFERRED_COUNTRIES}
                  value={phone}
                />
              </div>
              <FieldError id="rfq-phone-error" message={errors.phone} />
            </div>
          </div>
        </fieldset>

        <Turnstile key={attempt} onStatus={onVerification} theme="dark" />

        <div className="rfq-form-actions">
          <button aria-busy={pending} disabled={pending} type="submit">
            {pending ? 'Sending…' : 'Request a quote'}
            <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <p>
            <em>*</em> Required. We only use your details to reply to this enquiry.
          </p>
        </div>
      </form>
    </div>
  )
}
