/** Sanitize a display phone number into a tel: href (keeps digits and +). */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}
