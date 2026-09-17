import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })
const { docs } = await payload.find({ collection: 'industry-pages', depth: 0, limit: 50, overrideAccess: true, sort: 'slug' })
for (const page of docs as Record<string, unknown>[]) {
  const gallery = ((page.layout as Record<string, unknown>[]) ?? []).find((b) => b.blockType === 'productGallery') as Record<string, unknown> | undefined
  if (!gallery) { console.log(`${page.slug}: no gallery block`); continue }
  const filters = (gallery.filters as { label: string; productFamily: number | null }[] ?? []).map((f) => `${f.label}#${f.productFamily}`)
  console.log(`${page.slug}: items=${(gallery.items as unknown[] ?? []).length} filters=[${filters.join(', ')}]`)
}
process.exit(0)
