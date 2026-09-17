import type { Payload, Where } from 'payload'

import { campaignEmail, type CampaignContent } from './emails'
import { absoluteUrl, DEFAULT_DAILY_LIMIT } from './config'

/**
 * Sends queued newsletter emails in batches.
 *
 * One campaign at a time, oldest first. Each batch takes the next Active
 * subscribers who follow the campaign's topic, after the last one reached
 * (the campaign's `cursor`), so a run that stops -- a time limit, the daily
 * cap, a crash -- resumes where it left off and nobody is emailed twice.
 *
 * `lockedUntil` keeps two runs off the same campaign: a run takes the lock,
 * and a second run skips a campaign whose lock has not expired.
 *
 * The daily count lives in Newsletter Settings. When it is reached the
 * campaign is marked Paused and the next day's run carries on.
 */

const BATCH_SIZE = 20
const LOCK_MS = 2 * 60 * 1000

export type DispatchResult = {
  /** Campaigns still waiting when the run stopped. */
  remaining: boolean
  sent: number
  stoppedBy: 'daily-limit' | 'done' | 'time-budget'
}

type CampaignDoc = {
  body: string
  ctaLabel?: null | string
  ctaUrl?: null | string
  cursor?: null | number
  failedCount?: null | number
  heading?: null | string
  id: number
  image?: null | number | { url?: null | string }
  lastError?: null | string
  preheader?: null | string
  sentCount?: null | number
  status: string
  subject: string
  topic: string
}

type SubscriberDoc = { email: string; id: number; token: string }

type SettingsDoc = {
  dailyLimit?: null | number
  sentToday?: null | number
  sentTodayDate?: null | string
}

const today = () => new Date().toISOString().slice(0, 10)

export function contentOf(campaign: CampaignDoc): CampaignContent {
  const image = campaign.image
  return {
    body: campaign.body,
    ctaLabel: campaign.ctaLabel,
    ctaUrl: campaign.ctaUrl,
    heading: campaign.heading,
    imageUrl: typeof image === 'object' && image?.url ? absoluteUrl(image.url) : null,
    preheader: campaign.preheader,
    subject: campaign.subject,
  }
}

async function readDailyAllowance(payload: Payload) {
  const settings = (await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: 'newsletter-settings',
  })) as SettingsDoc
  const limit = settings.dailyLimit || DEFAULT_DAILY_LIMIT
  const sentToday = settings.sentTodayDate === today() ? settings.sentToday || 0 : 0
  return { left: Math.max(0, limit - sentToday), sentToday }
}

async function recordSent(payload: Payload, sentToday: number, justSent: number) {
  await payload.updateGlobal({
    data: { sentToday: sentToday + justSent, sentTodayDate: today() },
    overrideAccess: true,
    slug: 'newsletter-settings',
  })
}

/** Writes the sender's own progress, without re-running the editor hooks' rules. */
function updateCampaign(payload: Payload, id: number, data: Record<string, unknown>) {
  return payload.update({
    collection: 'newsletter-campaigns',
    context: { newsletterSystem: true },
    data,
    depth: 0,
    id,
    overrideAccess: true,
  })
}

async function nextCampaign(payload: Payload): Promise<CampaignDoc | undefined> {
  const now = new Date().toISOString()
  const where: Where = {
    and: [
      { status: { in: ['queued', 'sending', 'paused'] } },
      { or: [{ lockedUntil: { exists: false } }, { lockedUntil: { less_than: now } }] },
    ],
  }
  const { docs } = await payload.find({
    collection: 'newsletter-campaigns',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    sort: 'queuedAt',
    where,
  })
  return docs[0] as unknown as CampaignDoc | undefined
}

async function nextSubscribers(payload: Payload, campaign: CampaignDoc, limit: number) {
  const { docs } = await payload.find({
    collection: 'subscribers',
    depth: 0,
    limit,
    overrideAccess: true,
    pagination: false,
    select: { email: true, token: true },
    sort: 'id',
    where: {
      and: [
        { status: { equals: 'active' } },
        { topics: { in: [campaign.topic] } },
        { id: { greater_than: campaign.cursor || 0 } },
      ],
    },
  })
  return docs as unknown as SubscriberDoc[]
}

async function hasWaitingCampaigns(payload: Payload) {
  const { totalDocs } = await payload.count({
    collection: 'newsletter-campaigns',
    overrideAccess: true,
    where: { status: { in: ['queued', 'sending', 'paused'] } },
  })
  return totalDocs > 0
}

export async function dispatchNewsletters(
  payload: Payload,
  options: { budgetMs?: number } = {},
): Promise<DispatchResult> {
  const deadline = Date.now() + (options.budgetMs ?? 45_000)
  let sent = 0

  while (Date.now() < deadline) {
    const allowance = await readDailyAllowance(payload)
    if (allowance.left === 0) {
      const { docs } = await payload.find({
        collection: 'newsletter-campaigns',
        depth: 0,
        limit: 50,
        overrideAccess: true,
        where: { status: { in: ['queued', 'sending'] } },
      })
      for (const doc of docs) await updateCampaign(payload, doc.id as number, { status: 'paused' })
      return { remaining: docs.length > 0 || (await hasWaitingCampaigns(payload)), sent, stoppedBy: 'daily-limit' }
    }

    const campaign = await nextCampaign(payload)
    if (!campaign) return { remaining: false, sent, stoppedBy: 'done' }

    await updateCampaign(payload, campaign.id, {
      lockedUntil: new Date(Date.now() + LOCK_MS).toISOString(),
      status: 'sending',
    })

    const batch = await nextSubscribers(payload, campaign, Math.min(BATCH_SIZE, allowance.left))
    if (batch.length === 0) {
      await updateCampaign(payload, campaign.id, {
        finishedAt: new Date().toISOString(),
        lockedUntil: null,
        status: 'sent',
      })
      continue
    }

    const content = contentOf(campaign)
    let batchSent = 0
    let batchFailed = 0
    let lastError = campaign.lastError ?? null
    let cursor = campaign.cursor || 0

    for (const subscriber of batch) {
      try {
        await payload.sendEmail(campaignEmail(content, subscriber))
        batchSent += 1
      } catch (error) {
        batchFailed += 1
        lastError = `${new Date().toISOString()} ${subscriber.email}: ${
          error instanceof Error ? error.message : String(error)
        }`.slice(0, 1000)
        payload.logger.error({ err: error, msg: `[newsletter] Could not email ${subscriber.email}` })
      }
      cursor = subscriber.id
    }

    sent += batchSent
    await recordSent(payload, allowance.sentToday, batchSent + batchFailed)
    await updateCampaign(payload, campaign.id, {
      cursor,
      failedCount: (campaign.failedCount || 0) + batchFailed,
      lastError,
      lockedUntil: null,
      sentCount: (campaign.sentCount || 0) + batchSent,
    })
  }

  return { remaining: await hasWaitingCampaigns(payload), sent, stoppedBy: 'time-budget' }
}

/**
 * Starts a sending run in its own request, so a long list is not bound to
 * the lifetime of whatever request queued it. The run answers at once and
 * keeps sending after its response; see /newsletter/dispatch.
 */
export async function kickDispatch() {
  try {
    const headers: Record<string, string> = {}
    if (process.env.CRON_SECRET) headers.authorization = `Bearer ${process.env.CRON_SECRET}`
    await fetch(absoluteUrl('/newsletter/dispatch'), {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    // The daily cron picks up anything a failed kick leaves behind.
    console.error('[newsletter] Could not start a sending run', error)
  }
}
