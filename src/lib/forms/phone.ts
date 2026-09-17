import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Phone numbers for the enquiry form, checked the same way in the browser and
 * on the server so the two can never disagree about what counts as valid.
 */

/**
 * The picker always shows the selected country's dial code, so "+971" with
 * nothing after it means the optional field was left alone. Only the browser
 * knows which country is selected -- dial codes run from one digit to four
 * (+1268 is Antigua) -- so it decides, and posts an empty value.
 */
export function isDialCodeOnly(value: string, dialCode: string | undefined) {
  const digits = value.replace(/\D/g, '')
  return digits === '' || (Boolean(dialCode) && digits === dialCode)
}

export type PhoneCheck =
  | { ok: true; value: string | undefined }
  | { ok: false; message: string }

/**
 * Empty is fine; anything else has to be a real number for its country. A
 * valid number comes back in international format, "+971 50 538 9979", which
 * is what the team reads in the admin and the email.
 */
export function checkPhone(value: string | null | undefined): PhoneCheck {
  const raw = (value ?? '').trim()
  if (raw === '' || raw === '+') return { ok: true, value: undefined }

  if (!isValidPhoneNumber(raw)) {
    return { ok: false, message: 'Enter a valid phone number for the selected country.' }
  }

  return { ok: true, value: parsePhoneNumberFromString(raw)!.formatInternational() }
}
