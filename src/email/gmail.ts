import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

/**
 * Outgoing email through a Gmail account, for the enquiry and newsletter
 * forms (and Payload's own mail, such as password resets).
 *
 * Gmail needs an App Password here, not the account password: turn on 2-Step
 * Verification for the account, then create one at
 * https://myaccount.google.com/apppasswords and put the 16 characters in
 * SMTP_PASS. Gmail always sends as the signed-in account, so SMTP_USER is also
 * the From address.
 *
 * Without both variables Payload has no adapter and prints each email to the
 * server console instead -- fine in development, and it says so on start-up.
 */
export function gmailEmailAdapter() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn(
      '[email] SMTP_USER / SMTP_PASS are not set, so form emails are printed to this console instead of being sent.',
    )
    return undefined
  }

  return nodemailerAdapter({
    defaultFromAddress: user,
    defaultFromName: process.env.SMTP_FROM_NAME || 'Sky Wings Website',
    // Verifying opens an SMTP connection on every cold start; a bad password
    // is reported when a message is sent instead.
    skipVerify: true,
    transportOptions: {
      auth: { pass: pass.replace(/\s+/g, ''), user },
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
    },
  })
}
