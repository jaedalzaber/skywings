/**
 * Writes the full top-level menu into the Header global.
 *
 * The six menus live in `defaultHeaderData` (src/data/site.ts), but those
 * defaults only apply when the global is empty -- and it currently holds two
 * rows, so Configurators, Capabilities, Resources and About never render.
 * Seeding the global keeps navigation editable in the admin rather than
 * merging defaults in code, which would resurrect any item an editor deleted.
 *
 * Children are deliberately left empty: Industries is filled from published
 * industry pages and Products from product families, both at request time.
 *
 * Idempotent: re-running restores the same six rows. Existing rows whose
 * label matches keep their hand-curated children.
 *
 *   pnpm run seed:header-nav
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

const MENUS = [
  { href: '/industries', label: 'Industries' },
  { href: '/products', label: 'Products' },
  { href: '/#configurators', label: 'Configurators' },
  { href: '/capabilities', label: 'Capabilities' },
  { href: '/brochures', label: 'Resources' },
  { href: '/#about', label: 'About' },
]

const payload = await getPayload({ config })
const header = await payload.findGlobal({ slug: 'header', depth: 0 })
const existing = header.navigation ?? []

const navigation = MENUS.map((menu) => {
  const match = existing.find(
    (item) => item.label?.trim().toLowerCase() === menu.label.toLowerCase(),
  )

  // Keep any children an editor curated by hand; everything else is generated.
  return match?.children?.length ? { ...menu, children: match.children } : menu
})

console.log('Header navigation before:', existing.map((item) => item.label).join(', ') || '(empty)')

await payload.updateGlobal({ slug: 'header', data: { navigation } })

const updated = await payload.findGlobal({ slug: 'header', depth: 0 })
console.log('Header navigation after: ', (updated.navigation ?? []).map((i) => i.label).join(', '))

process.exit(0)
