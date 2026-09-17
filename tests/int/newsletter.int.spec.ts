// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const afterTasks: (() => unknown)[] = []
vi.mock('next/server', () => ({ after: (task: () => unknown) => afterTasks.push(task) }))

import { notifySubscribersOnPublish, campaignFor } from '@/lib/newsletter/autoNotify'
import { afterCampaignChange, beforeCampaignChange } from '@/lib/newsletter/campaignHooks'
import { absoluteUrl, isToken, newToken, siteUrl } from '@/lib/newsletter/config'
import { dispatchNewsletters } from '@/lib/newsletter/dispatch'
import { campaignEmail, confirmationEmail } from '@/lib/newsletter/emails'
import { savePreferences } from '@/lib/newsletter/subscriptions'

type Args = Record<string, unknown>
const run = (hook: unknown, args: Args) => (hook as (a: Args) => unknown)(args)

afterEach(() => {
  vi.unstubAllEnvs()
  afterTasks.length = 0
})

describe('newsletter config', () => {
  test('builds absolute links from the configured site address', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://www.skywings.ae/')
    expect(siteUrl()).toBe('https://www.skywings.ae')
    expect(absoluteUrl('/resources/x')).toBe('https://www.skywings.ae/resources/x')
    expect(absoluteUrl('https://other.example/y')).toBe('https://other.example/y')
  })

  test('makes long, unguessable tokens and rejects anything else', () => {
    const token = newToken()
    expect(isToken(token)).toBe(true)
    expect(newToken()).not.toBe(token)
    for (const bad of ['', 'test', 'a'.repeat(63), 'Z'.repeat(64), undefined]) expect(isToken(bad)).toBe(false)
  })
})

describe('newsletter emails', () => {
  const subscriber = { email: 'ann@example.com', token: 'b'.repeat(64) }

  test('escapes campaign text and adds one-click unsubscribe', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://www.skywings.ae')
    const email = campaignEmail(
      {
        body: 'Hello <script>x</script>\n\nSecond paragraph',
        ctaLabel: 'Read',
        ctaUrl: '/resources/a',
        imageUrl: '/media/a.png',
        subject: 'News\nBcc: evil@example.com',
      },
      subscriber,
    )

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('https://www.skywings.ae/resources/a')
    expect(email.html).toContain('https://www.skywings.ae/media/a.png')
    expect(email.html).toContain(`/newsletter/preferences?token=${subscriber.token}`)
    expect(email.subject).not.toMatch(/[\r\n]/)
    expect(email.headers).toEqual({
      'List-Unsubscribe': `<https://www.skywings.ae/newsletter/unsubscribe?token=${subscriber.token}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
    expect(email.text).toContain('Read: https://www.skywings.ae/resources/a')
  })

  test('sends the confirmation link to the address that signed up', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://www.skywings.ae')
    const email = confirmationEmail('ann@example.com', subscriber.token)
    expect(email.to).toBe('ann@example.com')
    expect(email.text).toContain(`https://www.skywings.ae/newsletter/confirm?token=${subscriber.token}`)
  })
})

describe('campaign status rules', () => {
  test('lets an editor start, cancel and resume, and stamps the queue time', () => {
    const data: Args = { status: 'queued' }
    run(beforeCampaignChange, { context: {}, data, originalDoc: { status: 'draft' } })
    expect(typeof data.queuedAt).toBe('string')

    expect(() =>
      run(beforeCampaignChange, { context: {}, data: { status: 'cancelled' }, originalDoc: { status: 'sending' } }),
    ).not.toThrow()
  })

  test('refuses statuses only the sender sets, and re-sending a sent email', () => {
    for (const status of ['sending', 'paused', 'sent']) {
      expect(() =>
        run(beforeCampaignChange, { context: {}, data: { status }, originalDoc: { status: 'draft' } }),
      ).toThrow(/set automatically/)
    }
    expect(() =>
      run(beforeCampaignChange, { context: {}, data: { status: 'queued' }, originalDoc: { status: 'sent' } }),
    ).toThrow(/already been sent/)
  })

  test('lets the sender set its own statuses', () => {
    expect(() =>
      run(beforeCampaignChange, {
        context: { newsletterSystem: true },
        data: { status: 'sent' },
        originalDoc: { status: 'sending' },
      }),
    ).not.toThrow()
  })

  test('starts a sending run once, when an editor queues it', () => {
    const fetchSpy = vi.fn(async () => new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchSpy)
    const req = { payload: {} }

    run(afterCampaignChange, { context: {}, doc: { status: 'queued' }, previousDoc: { status: 'draft' }, req })
    expect(afterTasks).toHaveLength(1)

    run(afterCampaignChange, { context: {}, doc: { status: 'queued' }, previousDoc: { status: 'queued' }, req })
    run(afterCampaignChange, { context: { newsletterSystem: true }, doc: { status: 'queued' }, previousDoc: {}, req })
    expect(afterTasks).toHaveLength(1)
    vi.unstubAllGlobals()
  })
})

describe('announcing a publish', () => {
  function fakePayload(overrides: Args = {}) {
    return {
      count: vi.fn(async () => ({ totalDocs: 0 })),
      create: vi.fn(async () => ({ id: 1 })),
      findGlobal: vi.fn(async () => ({ autoNotifyArticles: true, autoNotifyProducts: true })),
      logger: { error: vi.fn() },
      ...overrides,
    }
  }

  const article = { _status: 'published', excerpt: 'How to specify a bend.', id: 12, slug: 'bends', title: 'Designing bends' }

  test('writes the announcement from the article', () => {
    expect(campaignFor('articles', { ...article, featuredImage: { id: 7 } })).toEqual({
      body: 'How to specify a bend.',
      ctaLabel: 'Read the article',
      ctaUrl: '/resources/bends',
      heading: 'Designing bends',
      image: 7,
      preheader: 'How to specify a bend.',
      subject: 'New article: Designing bends',
      topic: 'articles',
    })
    expect(campaignFor('products', { _status: 'published', id: 3, slug: 'cart', summary: 'A cart.', title: 'Meal cart' })).toMatchObject({
      ctaUrl: '/products/cart',
      subject: 'New product: Meal cart',
      topic: 'products',
    })
  })

  test('queues one email the first time an editor publishes', async () => {
    const payload = fakePayload()
    await run(notifySubscribersOnPublish('articles'), {
      context: {},
      doc: article,
      previousDoc: { _status: 'draft' },
      req: { payload, user: { id: 1 } },
    })

    expect(payload.create).toHaveBeenCalledTimes(1)
    const created = (payload.create.mock.calls[0] as unknown as [{ data: Args }])[0].data
    expect(created).toMatchObject({
      source: { relationTo: 'blog-posts', value: 12 },
      sourceKey: 'blog-posts:12',
      status: 'queued',
    })
  })

  test('stays quiet for re-saves, drafts, scripts, repeats and when switched off', async () => {
    const cases: [string, Args, ReturnType<typeof fakePayload>][] = [
      ['already published', { doc: article, previousDoc: { _status: 'published' }, req: { user: { id: 1 } } }, fakePayload()],
      ['a draft save', { doc: { ...article, _status: 'draft' }, previousDoc: {}, req: { user: { id: 1 } } }, fakePayload()],
      ['a script, no user', { doc: article, previousDoc: {}, req: {} }, fakePayload()],
      ['announced before', { doc: article, previousDoc: {}, req: { user: { id: 1 } } }, fakePayload({ count: vi.fn(async () => ({ totalDocs: 1 })) })],
      ['switched off', { doc: article, previousDoc: {}, req: { user: { id: 1 } } }, fakePayload({ findGlobal: vi.fn(async () => ({ autoNotifyArticles: false })) })],
    ]

    for (const [label, args, payload] of cases) {
      await run(notifySubscribersOnPublish('articles'), {
        context: {},
        ...args,
        req: { ...(args.req as Args), payload },
      })
      expect(payload.create, label).not.toHaveBeenCalled()
    }
  })

  test('never blocks the publish if queueing fails', async () => {
    const payload = fakePayload({ create: vi.fn(async () => { throw new Error('db down') }) })
    await expect(
      run(notifySubscribersOnPublish('products'), {
        context: {},
        doc: { ...article, id: 3 },
        previousDoc: {},
        req: { payload, user: { id: 1 } },
      }),
    ).resolves.toBeTruthy()
    expect(payload.logger.error).toHaveBeenCalled()
  })
})

describe('preferences', () => {
  const payload = { update: vi.fn(async () => ({})) }
  beforeEach(() => payload.update.mockClear())

  test('saves ticked topics, ignores unknown ones, and confirms a pending subscriber', async () => {
    const result = await savePreferences(
      payload as never,
      { confirmedAt: null, id: 9, status: 'pending' } as never,
      ['products', 'bogus', 'products', 'news'],
    )

    expect(result).toEqual({ topics: ['products', 'news'], unsubscribed: false })
    const { data } = (payload.update.mock.calls[0] as unknown as [{ data: Args }])[0]
    expect(data.topics).toEqual(['products', 'news'])
    expect(data.status).toBe('active')
  })

  test('treats ticking nothing as unsubscribing', async () => {
    const result = await savePreferences(payload as never, { id: 9, status: 'active' } as never, [])
    expect(result.unsubscribed).toBe(true)
    expect((payload.update.mock.calls[0] as unknown as [{ data: Args }])[0].data.status).toBe('unsubscribed')
  })
})

describe('dispatch', () => {
  test('pauses waiting campaigns once the daily limit is used up', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      count: vi.fn(async () => ({ totalDocs: 1 })),
      find: vi.fn(async () => ({ docs: [{ id: 5, status: 'sending' }] })),
      findGlobal: vi.fn(async () => ({ dailyLimit: 10, sentToday: 10, sentTodayDate: today })),
      sendEmail: vi.fn(),
      update: vi.fn(async () => ({})),
    }

    const result = await dispatchNewsletters(payload as never, { budgetMs: 1000 })

    expect(result).toEqual({ remaining: true, sent: 0, stoppedBy: 'daily-limit' })
    expect(payload.sendEmail).not.toHaveBeenCalled()
    expect((payload.update.mock.calls[0] as unknown as [{ data: Args; id: number }])[0]).toMatchObject({
      data: { status: 'paused' },
      id: 5,
    })
  })

  test('counts a new day from zero', async () => {
    const payload = {
      count: vi.fn(async () => ({ totalDocs: 0 })),
      find: vi.fn(async () => ({ docs: [] })),
      findGlobal: vi.fn(async () => ({ dailyLimit: 10, sentToday: 10, sentTodayDate: '2000-01-01' })),
      sendEmail: vi.fn(),
      update: vi.fn(async () => ({})),
    }

    const result = await dispatchNewsletters(payload as never, { budgetMs: 1000 })
    expect(result.stoppedBy).toBe('done')
  })
})
