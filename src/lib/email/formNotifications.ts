import type { Payload } from 'payload'

/**
 * The emails the public forms send, through Payload's email adapter (Gmail
 * SMTP when SMTP_USER and SMTP_PASS are set; printed to the server console
 * otherwise, see payload.config.ts).
 *
 * Every value here was typed by a stranger, so it is escaped before it goes
 * anywhere near HTML, and header fields are stripped of line breaks.
 */

export type RFQEmailData = {
  buyerName: string
  company?: string
  email: string
  message: string
  phone?: string
  productInterest?: string
  quoteReference: string
  sourcePage?: string
}

export const BRAND = 'Sky Wings Engineering Industries'

/** Who hears about new enquiries and subscribers. */
export function teamInbox() {
  return process.env.CONTACT_NOTIFY_TO || process.env.SMTP_USER || 'info@skywings.ae'
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Subjects and names go into headers; a newline there injects another header. */
export function headerSafe(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
}

export function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#171717">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e4e1da;border-radius:8px">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e4e1da">
<p style="margin:0;color:#2453d4;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(BRAND)}</p>
<h1 style="margin:8px 0 0;font-size:20px;font-weight:600">${escapeHtml(title)}</h1>
</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.55">${body}</td></tr>
</table></body></html>`
}

function detailRows(rows: [label: string, value: string | undefined][]) {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#6f6d68;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0">${escapeHtml(value!)}</td></tr>`,
    )
    .join('')
}

export function rfqTeamEmail(rfq: RFQEmailData) {
  const adminLink = siteUrl() ? `${siteUrl()}/admin/collections/rfqs` : ''
  const rows: [string, string | undefined][] = [
    ['Reference', rfq.quoteReference],
    ['Name', rfq.buyerName],
    ['Company', rfq.company],
    ['Email', rfq.email],
    ['Phone', rfq.phone],
    ['Product', rfq.productInterest],
    ['Sent from', rfq.sourcePage],
  ]

  const html = layout(
    'New enquiry from the website',
    `<table role="presentation" style="border-collapse:collapse;margin:0 0 20px">${detailRows(rows)}</table>
<p style="margin:0 0 6px;color:#6f6d68">What they need</p>
<p style="margin:0;padding:14px 16px;background:#fbfbfa;border:1px solid #e4e1da;border-radius:6px;white-space:pre-wrap">${escapeHtml(rfq.message)}</p>
<p style="margin:20px 0 0;color:#6f6d68;font-size:13px">Reply to this email to answer ${escapeHtml(rfq.buyerName)} directly.${
      adminLink ? ` All enquiries are in the <a href="${escapeHtml(adminLink)}">admin</a>.` : ''
    }</p>`,
  )

  const text = [
    'New enquiry from the website',
    '',
    ...rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`),
    '',
    'What they need:',
    rfq.message,
  ].join('\n')

  return {
    html,
    replyTo: `${headerSafe(rfq.buyerName)} <${headerSafe(rfq.email)}>`,
    subject: headerSafe(
      `New enquiry ${rfq.quoteReference}: ${rfq.buyerName}${rfq.company ? ` (${rfq.company})` : ''}`,
    ),
    text,
    to: teamInbox(),
  }
}

export function rfqAcknowledgementEmail(rfq: RFQEmailData) {
  const html = layout(
    'We have received your enquiry',
    `<p style="margin:0 0 14px">Dear ${escapeHtml(rfq.buyerName)},</p>
<p style="margin:0 0 14px">Thank you for contacting ${escapeHtml(BRAND)}. Our team will review your requirement and get back to you by email or phone, usually within one working day.</p>
<p style="margin:0 0 6px;color:#6f6d68">Your reference: <strong style="color:#171717">${escapeHtml(rfq.quoteReference)}</strong></p>
<p style="margin:0 0 6px;color:#6f6d68">What you sent</p>
<p style="margin:0;padding:14px 16px;background:#fbfbfa;border:1px solid #e4e1da;border-radius:6px;white-space:pre-wrap">${escapeHtml(rfq.message)}</p>
<p style="margin:20px 0 0">Kind regards,<br>${escapeHtml(BRAND)}</p>`,
  )

  const text = [
    `Dear ${rfq.buyerName},`,
    '',
    `Thank you for contacting ${BRAND}. Our team will review your requirement and get back to you by email or phone, usually within one working day.`,
    '',
    `Your reference: ${rfq.quoteReference}`,
    '',
    'What you sent:',
    rfq.message,
    '',
    'Kind regards,',
    BRAND,
  ].join('\n')

  return {
    html,
    replyTo: teamInbox(),
    subject: headerSafe(`We received your enquiry (${rfq.quoteReference})`),
    text,
    to: headerSafe(rfq.email),
  }
}

/**
 * Sends, and never throws: the submission is already saved by the time this
 * runs, so a mail failure must not turn into an error for the sender. It is
 * logged for whoever reads the server logs.
 */
export async function sendSafely(
  payload: Payload,
  message: {
    headers?: Record<string, string>
    html: string
    replyTo?: string
    subject: string
    text: string
    to: string
  },
) {
  try {
    await payload.sendEmail(message)
    return true
  } catch (error) {
    payload.logger.error({ err: error, msg: `[forms] Could not send "${message.subject}"` })
    return false
  }
}
