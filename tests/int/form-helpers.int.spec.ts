// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const headerValues = new Map<string, string>()
vi.mock('next/headers', () => ({
  headers: async () => ({ get: (name: string) => headerValues.get(name) ?? null }),
}))

import {
  escapeHtml,
  headerSafe,
  rfqAcknowledgementEmail,
  rfqTeamEmail,
} from '@/lib/email/formNotifications'
import { checkForBots, MIN_FILL_MS, resetRateLimits } from '@/lib/forms/botGuard'
import { checkPhone, isDialCodeOnly } from '@/lib/forms/phone'

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const human = () => ({ startedAt: String(Date.now() - MIN_FILL_MS - 1000) })

describe('phone check', () => {
  test('treats the selected country’s bare dial code as left empty, whatever its length', () => {
    expect(isDialCodeOnly('', undefined)).toBe(true)
    expect(isDialCodeOnly('+971', '971')).toBe(true)
    expect(isDialCodeOnly('+1268', '1268')).toBe(true)
    expect(isDialCodeOnly('+1 268', '1268')).toBe(true)
    // A number that has started is not empty, even when it is short.
    expect(isDialCodeOnly('+1 555', '1')).toBe(false)
    expect(isDialCodeOnly('+9715', '971')).toBe(false)

    for (const value of ['', '  ', '+']) {
      expect(checkPhone(value)).toEqual({ ok: true, value: undefined })
    }
  })

  test('accepts a real number and stores it in international format', () => {
    expect(checkPhone('+971505389979')).toEqual({ ok: true, value: '+971 50 538 9979' })
    expect(checkPhone('+44 20 7946 0958')).toEqual({ ok: true, value: '+44 20 7946 0958' })
  })

  test('refuses a number that is wrong for its country', () => {
    for (const value of ['+9715053', '+97150538997912345', '+1 555']) {
      expect(checkPhone(value).ok, value).toBe(false)
    }
  })
})

describe('bot guard', () => {
  beforeEach(() => {
    // Independent of a developer's .env; the Turnstile test sets its own.
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    resetRateLimits()
    headerValues.clear()
    headerValues.set('x-forwarded-for', '203.0.113.7, 10.0.0.1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  test('lets a person through', async () => {
    expect(await checkForBots(form(human()), { form: 't', rateLimit: 5 })).toEqual({ kind: 'human' })
  })

  test('drops the honeypot, a missing stamp, and an instant submission silently', async () => {
    const options = { form: 't', rateLimit: 5 }
    expect((await checkForBots(form({ ...human(), website: 'x' }), options)).kind).toBe('silent-drop')
    expect((await checkForBots(form({}), options)).kind).toBe('silent-drop')
    expect((await checkForBots(form({ startedAt: String(Date.now()) }), options)).kind).toBe(
      'silent-drop',
    )
  })

  test('limits one address per form, counting each form separately', async () => {
    for (let i = 0; i < 2; i++) {
      expect((await checkForBots(form(human()), { form: 'a', rateLimit: 2 })).kind).toBe('human')
    }
    expect((await checkForBots(form(human()), { form: 'a', rateLimit: 2 })).kind).toBe('reject')
    expect((await checkForBots(form(human()), { form: 'b', rateLimit: 2 })).kind).toBe('human')

    headerValues.set('x-forwarded-for', '198.51.100.1')
    expect((await checkForBots(form(human()), { form: 'a', rateLimit: 2 })).kind).toBe('human')
  })

  test('requires a Turnstile token only once the secret is set', async () => {
    const options = { form: 't', rateLimit: 50, turnstile: true }
    expect((await checkForBots(form(human()), options)).kind).toBe('human')

    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret')
    expect((await checkForBots(form(human()), options)).kind).toBe('reject')

    const verify = vi.fn(async () => Response.json({ success: true }))
    vi.stubGlobal('fetch', verify)
    const verdict = await checkForBots(form({ ...human(), 'cf-turnstile-response': 'token' }), options)
    expect(verdict.kind).toBe('human')
    const body = (verify.mock.calls[0] as unknown as [string, { body: URLSearchParams }])[1].body
    expect(body.get('secret')).toBe('secret')
    expect(body.get('remoteip')).toBe('203.0.113.7')

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: false })))
    expect(
      (await checkForBots(form({ ...human(), 'cf-turnstile-response': 'bad' }), options)).kind,
    ).toBe('reject')
  })
})

describe('form emails', () => {
  const rfq = {
    buyerName: 'Ann <script>',
    company: 'Acme & Sons',
    email: 'ann@example.com',
    message: 'Need <b>50</b> stands\nby May',
    phone: '+971 50 538 9979',
    quoteReference: 'SW-260916-AB12',
    sourcePage: '/contact',
  }

  afterEach(() => vi.unstubAllEnvs())

  test('escapes everything the sender typed', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
    for (const message of [rfqTeamEmail(rfq), rfqAcknowledgementEmail(rfq)]) {
      expect(message.html).not.toContain('<script>')
      expect(message.html).not.toContain('<b>50</b>')
      expect(message.html).toContain('Ann &lt;script&gt;')
    }
  })

  test('keeps line breaks out of headers', () => {
    expect(headerSafe('Name\r\nBcc: x@y.z')).toBe('Name Bcc: x@y.z')
    const team = rfqTeamEmail({ ...rfq, buyerName: 'Ann\nBcc: evil@example.com' })
    expect(team.subject).not.toMatch(/[\r\n]/)
    expect(team.replyTo).not.toMatch(/[\r\n]/)
  })

  test('sends enquiries to the team with reply-to the sender, and acknowledges the sender', () => {
    vi.stubEnv('CONTACT_NOTIFY_TO', 'team@example.com')

    const team = rfqTeamEmail(rfq)
    expect(team.to).toBe('team@example.com')
    expect(team.replyTo).toBe('Ann <script> <ann@example.com>')
    expect(team.subject).toBe('New enquiry SW-260916-AB12: Ann <script> (Acme & Sons)')
    expect(team.text).toContain('Phone: +971 50 538 9979')

    const ack = rfqAcknowledgementEmail(rfq)
    expect(ack.to).toBe('ann@example.com')
    expect(ack.replyTo).toBe('team@example.com')
    expect(ack.text).toContain('SW-260916-AB12')
  })

  test('falls back to the Gmail account for the team inbox', () => {
    vi.stubEnv('CONTACT_NOTIFY_TO', '')
    vi.stubEnv('SMTP_USER', 'simplexstudio.xyz@gmail.com')
    expect(rfqTeamEmail(rfq).to).toBe('simplexstudio.xyz@gmail.com')
  })
})
