'use server'

import { after } from 'next/server'
import { z } from 'zod'

import { getPayloadClient } from '@/data/payload'
import {
  rfqAcknowledgementEmail,
  rfqTeamEmail,
  sendSafely,
} from '@/lib/email/formNotifications'
import { checkForBots } from '@/lib/forms/botGuard'
import { checkPhone } from '@/lib/forms/phone'

export type RFQField = 'buyerName' | 'company' | 'email' | 'message' | 'phone'

export type RFQState = {
  fieldErrors: Partial<Record<RFQField, string>>
  message: string
  /** Shown to the sender so a follow-up can quote it. */
  reference?: string
  status: 'error' | 'idle' | 'success'
  /** What was sent, so a refused form comes back filled in. */
  values: Partial<Record<RFQField, string>>
}

const rfqSchema = z.object({
  buyerName: z
    .string()
    .trim()
    .min(2, 'Please enter your name.')
    .max(120, 'That name is too long.'),
  company: z.string().trim().max(160, 'That company name is too long.').optional(),
  email: z
    .string()
    .trim()
    .max(254, 'That email address is too long.')
    .pipe(z.email('Please enter a valid email address.')),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a little more about what you need (at least 10 characters).')
    .max(5000, 'Please keep the message under 5,000 characters.'),
})

/** Emails from one address in this window before the form asks them to wait. */
const PER_EMAIL_LIMIT = 3
const PER_EMAIL_WINDOW_MS = 10 * 60 * 1000

function text(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

/** Only a same-site path is kept: the field is whatever the browser posts. */
function safeSourcePage(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value.slice(0, 200) : '/contact'
}

/** "SW-260916-4K7Q": dated, short enough to read out on the phone. */
function newReference(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0')
  return `SW-${date}-${suffix}`
}

export async function submitRFQ(_previous: RFQState, formData: FormData): Promise<RFQState> {
  const values: RFQState['values'] = {
    buyerName: text(formData, 'buyerName'),
    company: text(formData, 'company'),
    email: text(formData, 'email'),
    message: text(formData, 'message'),
    phone: text(formData, 'phone'),
  }

  const verdict = await checkForBots(formData, { form: 'rfq', rateLimit: 5, turnstile: true })
  if (verdict.kind === 'silent-drop') {
    return {
      fieldErrors: {},
      message: 'Thank you, your enquiry is with our team.',
      status: 'success',
      values: {},
    }
  }
  if (verdict.kind === 'reject') {
    return { fieldErrors: {}, message: verdict.message, status: 'error', values }
  }

  const parsed = rfqSchema.safeParse({
    buyerName: values.buyerName,
    company: values.company || undefined,
    email: values.email,
    message: values.message,
  })
  const phone = checkPhone(values.phone)

  const fieldErrors: RFQState['fieldErrors'] = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as RFQField
      fieldErrors[field] ??= issue.message
    }
  }
  if (!phone.ok) fieldErrors.phone = phone.message

  if (!parsed.success || !phone.ok) {
    return {
      fieldErrors,
      message: 'Please check the highlighted fields.',
      status: 'error',
      values,
    }
  }

  const productInterest = text(formData, 'productInterest').trim().slice(0, 200) || undefined
  const sourcePage = safeSourcePage(text(formData, 'sourcePage'))

  try {
    const payload = await getPayloadClient()

    const recent = await payload.count({
      collection: 'rfqs',
      overrideAccess: true,
      where: {
        and: [
          { email: { equals: parsed.data.email } },
          { createdAt: { greater_than: new Date(Date.now() - PER_EMAIL_WINDOW_MS).toISOString() } },
        ],
      },
    })
    if (recent.totalDocs >= PER_EMAIL_LIMIT) {
      return {
        fieldErrors: {},
        message:
          'We already have several recent enquiries from this email. Our team will be in touch; please wait a few minutes before sending another.',
        status: 'error',
        values,
      }
    }

    const quoteReference = newReference()
    const rfq = {
      ...parsed.data,
      phone: phone.value,
      productInterest,
      quoteReference,
      sourcePage,
    }

    // Public create is closed on the REST API, so only this action, with its
    // bot checks, can add an enquiry.
    await payload.create({
      collection: 'rfqs',
      data: { ...rfq, status: 'new' },
      overrideAccess: true,
    })

    // After the response: the sender is not kept waiting on Gmail.
    after(async () => {
      await sendSafely(payload, rfqTeamEmail(rfq))
      await sendSafely(payload, rfqAcknowledgementEmail(rfq))
    })

    return {
      fieldErrors: {},
      message: 'Thank you, your enquiry is with our team.',
      reference: quoteReference,
      status: 'success',
      values: {},
    }
  } catch (error) {
    console.error('[forms] Unable to save enquiry', error)
    return {
      fieldErrors: {},
      message: 'Something went wrong on our side. Please try again, or email us directly.',
      status: 'error',
      values,
    }
  }
}
