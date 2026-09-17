import { randomBytes } from 'node:crypto'

/**
 * Shared pieces of the newsletter: the topics a subscriber can choose, the
 * absolute site address every emailed link needs, and the private token
 * that stands in for a login on the confirm and preferences pages.
 */

export const NEWSLETTER_TOPICS = [
  { label: 'New articles and guides', value: 'articles' },
  { label: 'New products', value: 'products' },
  { label: 'Company news', value: 'news' },
] as const

export type NewsletterTopic = (typeof NEWSLETTER_TOPICS)[number]['value']

export const ALL_TOPICS: NewsletterTopic[] = NEWSLETTER_TOPICS.map((topic) => topic.value)

export function isTopic(value: unknown): value is NewsletterTopic {
  return typeof value === 'string' && (ALL_TOPICS as string[]).includes(value)
}

/**
 * Where emailed links point. NEXT_PUBLIC_SERVER_URL wins; on Vercel the
 * production domain is known without it; locally it is the dev server.
 */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path
  return `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`
}

/** 32 random bytes: unguessable, and URL-safe as hex. */
export function newToken() {
  return randomBytes(32).toString('hex')
}

export function isToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

export const preferencesUrl = (token: string) => absoluteUrl(`/newsletter/preferences?token=${token}`)
export const confirmUrl = (token: string) => absoluteUrl(`/newsletter/confirm?token=${token}`)
export const oneClickUnsubscribeUrl = (token: string) =>
  absoluteUrl(`/newsletter/unsubscribe?token=${token}`)

/** Gmail allows about 500 messages a day; the form emails need some of that. */
export const DEFAULT_DAILY_LIMIT = 400
