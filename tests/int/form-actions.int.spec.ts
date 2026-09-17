// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'

const afterTasks: (() => unknown)[] = []
vi.mock('next/server', () => ({ after: (task: () => unknown) => afterTasks.push(task) }))
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => (name === 'x-forwarded-for' ? '203.0.113.9' : null) }),
}))

const payload = {
  count: vi.fn(async () => ({ totalDocs: 0 })),
  create: vi.fn(async () => ({ id: 1 })),
  find: vi.fn(async () => ({ docs: [] as Record<string, unknown>[] })),
  update: vi.fn(async () => ({ id: 1 })),
  logger: { error: vi.fn() },
  sendEmail: vi.fn(async () => undefined),
}
vi.mock('@/data/payload', () => ({ getPayloadClient: async () => payload }))

import { subscribeToNewsletter } from '@/actions/newsletter'
import { submitRFQ, type RFQState } from '@/actions/rfq'
import { MIN_FILL_MS, resetRateLimits } from '@/lib/forms/botGuard'

const idle: RFQState = { fieldErrors: {}, message: '', status: 'idle', values: {} }

function form(fields: Record<string, string>) {
  const data = new FormData()
  data.set('startedAt', String(Date.now() - MIN_FILL_MS - 1000))
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const enquiry = {
  buyerName: 'Ann Lee',
  company: 'Acme',
  email: 'ann@example.com',
  message: 'We need 50 folding stands by May.',
  phone: '+971505389979',
  sourcePage: '/contact',
}

async function runAfterTasks() {
  for (const task of afterTasks.splice(0)) await task()
}

beforeEach(() => {
  // Independent of a developer's .env: Turnstile has its own tests.
  vi.stubEnv('TURNSTILE_SECRET_KEY', '')
  resetRateLimits()
  afterTasks.length = 0
  vi.clearAllMocks()
  payload.count.mockResolvedValue({ totalDocs: 0 })
  payload.find.mockResolvedValue({ docs: [] })
})

describe('submitRFQ', () => {
  test('saves the enquiry, then emails the team and the sender', async () => {
    const state = await submitRFQ(idle, form(enquiry))

    expect(state.status).toBe('success')
    expect(state.reference).toMatch(/^SW-\d{6}-[A-Z0-9]{4}$/)
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'rfqs',
      data: {
        buyerName: 'Ann Lee',
        company: 'Acme',
        email: 'ann@example.com',
        message: 'We need 50 folding stands by May.',
        phone: '+971 50 538 9979',
        productInterest: undefined,
        quoteReference: state.reference,
        sourcePage: '/contact',
        status: 'new',
      },
      overrideAccess: true,
    })

    // Emails go after the response, never before it.
    expect(payload.sendEmail).not.toHaveBeenCalled()
    await runAfterTasks()
    const recipients = payload.sendEmail.mock.calls.map((call) => (call as unknown as [{ to: string }])[0].to)
    expect(recipients).toHaveLength(2)
    expect(recipients[1]).toBe('ann@example.com')
  })

  test('names each problem and hands the typed values back', async () => {
    const state = await submitRFQ(
      idle,
      form({ ...enquiry, buyerName: 'A', email: 'not-an-email', message: 'short', phone: '+97150' }),
    )

    expect(state.status).toBe('error')
    expect(Object.keys(state.fieldErrors).sort()).toEqual(['buyerName', 'email', 'message', 'phone'])
    expect(state.values.email).toBe('not-an-email')
    expect(payload.create).not.toHaveBeenCalled()
  })

  test('accepts an empty phone, which the picker posts as nothing', async () => {
    const state = await submitRFQ(idle, form({ ...enquiry, phone: '' }))
    expect(state.status).toBe('success')
  })

  test('tells a bot it worked and stores nothing', async () => {
    const state = await submitRFQ(idle, form({ ...enquiry, website: 'spam.example' }))

    expect(state.status).toBe('success')
    expect(state.reference).toBeUndefined()
    expect(payload.create).not.toHaveBeenCalled()
    expect(afterTasks).toHaveLength(0)
  })

  test('asks a busy address to wait', async () => {
    payload.count.mockResolvedValue({ totalDocs: 3 })
    const state = await submitRFQ(idle, form(enquiry))

    expect(state.status).toBe('error')
    expect(payload.create).not.toHaveBeenCalled()
  })

  test('keeps an off-site source page out of the record', async () => {
    await submitRFQ(idle, form({ ...enquiry, sourcePage: '//evil.example/x' }))
    const data = (payload.create.mock.calls[0] as unknown as [{ data: { sourcePage: string } }])[0].data
    expect(data.sourcePage).toBe('/contact')
  })
})

describe('subscribeToNewsletter', () => {
  const idleNewsletter = { message: '', status: 'idle' as const }
  const CHECK_INBOX = 'Almost done: check your inbox and click the link to confirm.'

  function sentTo() {
    return payload.sendEmail.mock.calls.map((call) => (call as unknown as [{ subject: string; to: string }])[0])
  }

  test('adds a new address as pending and emails it a confirmation link', async () => {
    const state = await subscribeToNewsletter(
      idleNewsletter,
      form({ email: ' New@Example.com ', source: 'site-footer' }),
    )

    expect(state).toEqual({ message: CHECK_INBOX, status: 'success' })
    const created = (payload.create.mock.calls[0] as unknown as [{ collection: string; data: Record<string, unknown> }])[0]
    expect(created.collection).toBe('subscribers')
    expect(created.data).toMatchObject({
      email: 'new@example.com',
      source: 'site-footer',
      status: 'pending',
      topics: ['articles', 'products', 'news'],
    })
    expect(created.data.token).toMatch(/^[a-f0-9]{64}$/)

    expect(payload.sendEmail).not.toHaveBeenCalled()
    await runAfterTasks()
    const [email] = sentTo()
    expect(email.to).toBe('new@example.com')
    expect(email.subject).toMatch(/^Confirm your subscription/)
  })

  test('tells an active subscriber so, and sends nothing', async () => {
    payload.find.mockResolvedValue({ docs: [{ email: 'a@example.com', id: 4, status: 'active', token: 't' }] })
    const state = await subscribeToNewsletter(idleNewsletter, form({ email: 'a@example.com' }))

    expect(state).toEqual({ message: 'You’re already subscribed. Thank you!', status: 'success' })
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
    expect(afterTasks).toHaveLength(0)
  })

  test('does not re-send a confirmation within ten minutes', async () => {
    payload.find.mockResolvedValue({
      docs: [{ confirmationSentAt: new Date().toISOString(), email: 'p@example.com', id: 5, status: 'pending', token: 't' }],
    })
    const state = await subscribeToNewsletter(idleNewsletter, form({ email: 'p@example.com' }))

    expect(state.message).toBe(CHECK_INBOX)
    expect(afterTasks).toHaveLength(0)
  })

  test('lets someone who unsubscribed sign up again, through a fresh confirmation', async () => {
    const token = 'a'.repeat(64)
    payload.find.mockResolvedValue({
      docs: [{ email: 'u@example.com', id: 6, status: 'unsubscribed', token }],
    })
    await subscribeToNewsletter(idleNewsletter, form({ email: 'u@example.com' }))

    const update = (payload.update.mock.calls[0] as unknown as [{ data: Record<string, unknown>; id: number }])[0]
    expect(update.id).toBe(6)
    expect(update.data.status).toBe('pending')
    await runAfterTasks()
    expect(sentTo()[0].to).toBe('u@example.com')
  })

  test('refuses an invalid address and drops bots silently', async () => {
    expect((await subscribeToNewsletter(idleNewsletter, form({ email: 'nope' }))).status).toBe('error')

    const bot = await subscribeToNewsletter(idleNewsletter, form({ email: 'a@b.co', website: 'x' }))
    expect(bot.status).toBe('success')
    expect(payload.create).not.toHaveBeenCalled()
  })

  test('still answers success when the confirmation email fails to send', async () => {
    payload.sendEmail.mockRejectedValueOnce(new Error('SMTP down'))
    const state = await subscribeToNewsletter(idleNewsletter, form({ email: 'x@example.com' }))

    expect(state.status).toBe('success')
    await expect(runAfterTasks()).resolves.toBeUndefined()
    expect(payload.logger.error).toHaveBeenCalled()
  })
})
