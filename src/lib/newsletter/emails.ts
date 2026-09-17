import { BRAND, escapeHtml, headerSafe, layout, teamInbox } from '../email/formNotifications'
import {
  absoluteUrl,
  confirmUrl,
  oneClickUnsubscribeUrl,
  preferencesUrl,
  siteUrl,
} from './config'

/**
 * The newsletter's emails: the confirmation that makes a subscription
 * active, the campaign email itself, and a note to the team when someone
 * confirms.
 *
 * Campaign text is written by editors, but the subscriber's address and any
 * copied article text still pass through escapeHtml -- nothing reaches HTML
 * unescaped.
 */

export type OutgoingEmail = {
  headers?: Record<string, string>
  html: string
  replyTo?: string
  subject: string
  text: string
  to: string
}

export type CampaignContent = {
  body: string
  ctaLabel?: null | string
  ctaUrl?: null | string
  heading?: null | string
  /** Site-relative or absolute; made absolute here. */
  imageUrl?: null | string
  preheader?: null | string
  subject: string
}

const POSTAL_LINE = `${BRAND} LLC · Sharjah, United Arab Emirates`

function paragraphs(body: string) {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function button(label: string, href: string) {
  return `<p style="margin:24px 0 0"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;border-radius:6px;background:#2453d4;color:#ffffff;font-weight:600;text-decoration:none">${escapeHtml(label)}</a></p>`
}

export function confirmationEmail(email: string, token: string): OutgoingEmail {
  const link = confirmUrl(token)

  return {
    html: layout(
      'Please confirm your subscription',
      `<p style="margin:0 0 14px">Thanks for signing up for updates from ${escapeHtml(BRAND)}.</p>
<p style="margin:0">Click the button to confirm that ${escapeHtml(email)} should receive our new articles, product launches and company news. You can choose which of these you get, or unsubscribe, at any time.</p>
${button('Confirm subscription', link)}
<p style="margin:24px 0 0;color:#6f6d68;font-size:13px">If you did not sign up, ignore this email and you will not hear from us again.</p>`,
    ),
    subject: `Confirm your subscription to ${BRAND} updates`,
    text: [
      `Thanks for signing up for updates from ${BRAND}.`,
      '',
      `Confirm that ${email} should receive our new articles, product launches and company news:`,
      link,
      '',
      'If you did not sign up, ignore this email and you will not hear from us again.',
    ].join('\n'),
    to: headerSafe(email),
  }
}

export function campaignEmail(
  content: CampaignContent,
  subscriber: { email: string; token: string },
): OutgoingEmail {
  const heading = content.heading?.trim() || content.subject
  const cta =
    content.ctaLabel?.trim() && content.ctaUrl?.trim()
      ? { href: absoluteUrl(content.ctaUrl.trim()), label: content.ctaLabel.trim() }
      : undefined
  const manage = preferencesUrl(subscriber.token)
  const unsubscribe = oneClickUnsubscribeUrl(subscriber.token)

  const preheader = content.preheader?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(content.preheader.trim())}</div>`
    : ''
  const image = content.imageUrl
    ? `<img alt="" src="${escapeHtml(absoluteUrl(content.imageUrl))}" width="544" style="display:block;width:100%;max-width:544px;height:auto;margin:0 0 20px;border-radius:6px">`
    : ''
  const body = paragraphs(content.body)
    .map((part) => `<p style="margin:0 0 14px;white-space:pre-line">${escapeHtml(part)}</p>`)
    .join('')
  const footer = `<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e4e1da;color:#6f6d68;font-size:12px;line-height:1.5">
You are receiving this because ${escapeHtml(subscriber.email)} subscribed to updates from ${escapeHtml(BRAND)}.<br>
<a href="${escapeHtml(manage)}" style="color:#6f6d68">Choose what you receive</a> · <a href="${escapeHtml(manage)}#unsubscribe" style="color:#6f6d68">Unsubscribe</a><br>
${escapeHtml(POSTAL_LINE)}</p>`

  return {
    // RFC 8058 one-click unsubscribe: Gmail and Outlook show their own button.
    headers: {
      'List-Unsubscribe': `<${unsubscribe}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: layout(heading, `${preheader}${image}${body}${cta ? button(cta.label, cta.href) : ''}${footer}`),
    replyTo: teamInbox(),
    subject: headerSafe(content.subject),
    text: [
      heading,
      '',
      ...paragraphs(content.body).flatMap((part) => [part, '']),
      ...(cta ? [`${cta.label}: ${cta.href}`, ''] : []),
      '---',
      `You are receiving this because ${subscriber.email} subscribed to updates from ${BRAND}.`,
      `Choose what you receive or unsubscribe: ${manage}`,
      POSTAL_LINE,
    ].join('\n'),
    to: headerSafe(subscriber.email),
  }
}

export function subscriberConfirmedTeamEmail(email: string): OutgoingEmail {
  return {
    html: layout(
      'New newsletter subscriber',
      `<p style="margin:0">${escapeHtml(email)} confirmed their subscription.</p>
<p style="margin:12px 0 0;color:#6f6d68;font-size:13px">The full list is in the <a href="${escapeHtml(`${siteUrl()}/admin/collections/subscribers`)}">admin</a> under Newsletter.</p>`,
    ),
    subject: headerSafe(`New newsletter subscriber: ${email}`),
    text: `${email} confirmed their subscription.\n\nThe full list is in the admin under Newsletter: ${siteUrl()}/admin/collections/subscribers`,
    to: teamInbox(),
  }
}
