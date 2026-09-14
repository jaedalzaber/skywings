/*
 * Client-safe defaults for the home locations section. Kept apart from
 * '@/data/home' so the client component can value-import them without
 * pulling the Payload client into the browser bundle.
 */
export type HomeLocation = {
  /** Address lines, set one per line on the page. */
  addressLines: string[]
  kind: string
  name: string
  phone: string
}

/*
 * "Made in the UAE, delivered across the / Middle East, Europe & Africa": the
 * lead is set light, the regions heavy, and the two are one sentence -- where
 * the work is made, and how far it goes. `reach` is no longer shown -- it
 * stays so content saved against the earlier design still reads.
 */
export const defaultLocationsTitle = {
  lead: 'Made in the UAE, delivered across the',
  reach: '',
  regions: ['Middle East', 'Europe', 'Africa'],
}

export const defaultLocations: HomeLocation[] = [
  {
    addressLines: ['A2, Plot No. 10576015-3,', 'Sajaa Industrial Area,', 'Sharjah, UAE'],
    kind: 'Branch',
    name: 'Sharjah',
    phone: '+971 509 469 979',
  },
  {
    addressLines: ['Plot No. D-81,', 'Thoban Industrial Area,', 'Fujairah, UAE'],
    kind: 'Branch',
    name: 'Thoban',
    phone: '+971 505 389 979',
  },
]

/*
 * Footer addresses are one string. Broken at the commas for the page, but a
 * short fragment -- a unit ("A2") or a country ("UAE") -- stays with its
 * neighbour rather than taking a line of its own, so
 * "A2, Plot No. 1, Sajaa Industrial Area, Sharjah, UAE" sets as three lines.
 */
const SHORT_FRAGMENT = 6

export function splitAddress(address: string): string[] {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const lines: string[] = []
  for (const part of parts) {
    const last = lines[lines.length - 1]
    if (last !== undefined && (last.length <= SHORT_FRAGMENT || part.length <= SHORT_FRAGMENT)) {
      lines[lines.length - 1] = `${last}, ${part}`
    } else {
      lines.push(part)
    }
  }
  return lines.map((line, index) => (index < lines.length - 1 ? `${line},` : line))
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
