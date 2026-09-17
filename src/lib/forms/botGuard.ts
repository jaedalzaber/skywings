import { headers } from 'next/headers'

/**
 * Spam protection shared by the public forms, cheapest check first.
 *
 * 1. Honeypot: a field no person sees. Anything in it is a bot.
 * 2. Fill time: the form stamps when it was mounted; a submission within a
 *    couple of seconds of that is a script, and one with no stamp never ran
 *    the page's JavaScript.
 * 3. Rate limit per IP, in memory. Best effort -- each server instance keeps
 *    its own count -- but it stops a flood from one address cheaply.
 * 4. Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set. This is the one
 *    a determined bot cannot script around; the others only raise the bar.
 *
 * Bots caught by 1 or 2 are told the message went, so they have no reason to
 * retry; nothing is stored or sent for them.
 */

export type BotVerdict =
  | { kind: 'human' }
  /** Pretend it worked; drop the submission. */
  | { kind: 'silent-drop'; reason: string }
  /** Tell the sender, who may be a person caught by a limit or a failed challenge. */
  | { kind: 'reject'; message: string }

/** Anything faster than this is not a person typing. */
export const MIN_FILL_MS = 2500

const RATE_WINDOW_MS = 10 * 60 * 1000
const rateBuckets = new Map<string, number[]>()

/** Exported for tests. */
export function resetRateLimits() {
  rateBuckets.clear()
}

export async function clientIp() {
  const list = await headers()
  const forwarded = list.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || list.get('x-real-ip') || 'unknown'
}

function withinRateLimit(key: string, limit: number, now: number) {
  const recent = (rateBuckets.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS)
  if (recent.length >= limit) {
    rateBuckets.set(key, recent)
    return false
  }
  recent.push(now)
  rateBuckets.set(key, recent)
  return true
}

async function verifyTurnstile(token: string, ip: string, secret: string) {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: new URLSearchParams({ remoteip: ip, response: token, secret }),
      method: 'POST',
      signal: AbortSignal.timeout(8000),
    })
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!result.success) {
      console.warn('[forms] Turnstile rejected a submission', result['error-codes'])
    }
    return Boolean(result.success)
  } catch (error) {
    // Cloudflare unreachable: fail closed, the sender can try again.
    console.error('[forms] Turnstile verification failed', error)
    return false
  }
}

export async function checkForBots(
  formData: FormData,
  options: { form: string; rateLimit: number; turnstile?: boolean },
): Promise<BotVerdict> {
  if (formData.get('website')) {
    return { kind: 'silent-drop', reason: 'honeypot' }
  }

  const now = Date.now()
  const startedAt = Number(formData.get('startedAt'))
  if (!Number.isFinite(startedAt) || startedAt <= 0 || now - startedAt < MIN_FILL_MS) {
    return { kind: 'silent-drop', reason: 'fill-time' }
  }

  const ip = await clientIp()
  if (!withinRateLimit(`${options.form}:${ip}`, options.rateLimit, now)) {
    return {
      kind: 'reject',
      message: 'Too many attempts from your connection. Please wait a few minutes and try again.',
    }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (options.turnstile && secret) {
    const token = formData.get('cf-turnstile-response')
    if (typeof token !== 'string' || !token || !(await verifyTurnstile(token, ip, secret))) {
      return {
        kind: 'reject',
        message: 'Please complete the verification and send again.',
      }
    }
  }

  return { kind: 'human' }
}
