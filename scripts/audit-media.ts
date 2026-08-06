/**
 * Reports every Media document whose underlying file no longer resolves, and
 * which documents still reference it.
 *
 * The Vercel Blob store this project migrated off took 55 files with it. This
 * finds the resulting dangling references so they can be reassigned.
 *
 *   pnpm run audit:media
 */
import config from '@payload-config'
import { getPayload } from 'payload'

type BrokenMedia = { filename: string; id: number | string; status: number; url: string }

const payload = await getPayload({ config })

// 1. Which media files no longer resolve?
const allMedia = await payload.find({ collection: 'media', depth: 0, limit: 1000, pagination: false })

const broken: BrokenMedia[] = []
const healthy = new Set<string>()

await Promise.all(
  allMedia.docs.map(async (doc) => {
    const media = doc as unknown as { filename?: string; id: number | string; url?: string }
    if (!media.url) return

    try {
      const res = await fetch(media.url, { method: 'GET' })
      if (res.ok) healthy.add(media.filename ?? '')
      else broken.push({ filename: media.filename ?? '?', id: media.id, status: res.status, url: media.url })
    } catch {
      broken.push({ filename: media.filename ?? '?', id: media.id, status: 0, url: media.url })
    }
  }),
)

broken.sort((a, b) => a.filename.localeCompare(b.filename))

console.log(`Media documents: ${allMedia.totalDocs}`)
console.log(`  resolving : ${healthy.size}`)
console.log(`  BROKEN    : ${broken.length}\n`)

const brokenIds = new Map(broken.map((b) => [String(b.id), b]))

// 2. Which documents still point at them?
const collectionsToScan = payload.config.collections
  .map((c) => c.slug)
  .filter((slug) => slug !== 'media' && slug !== 'users')

const references: { collection: string; doc: string; field: string; media: string }[] = []

function walk(
  node: unknown,
  path: string,
  onHit: (path: string, id: string) => void,
  isRoot = false,
) {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}[${i}]`, onHit))
    return
  }

  const record = node as Record<string, unknown>

  // A populated upload relationship looks like { id, filename, url, ... }.
  // Brochures and 3D assets are upload collections too and their integer IDs
  // overlap with Media's, so the filename has to match as well.
  //
  // Skipped at the root: a brochure document carries `filename` itself, and
  // returning here would mean never scanning its own coverImage field.
  if (!isRoot && 'filename' in record && 'id' in record) {
    const candidate = brokenIds.get(String(record.id))
    if (candidate && candidate.filename === record.filename) onHit(path, String(record.id))
    return
  }

  // Any other object carrying an `id` is a populated relationship to a
  // different document. Its fields belong to that document, not this one --
  // descending would attribute the same broken media to every parent that
  // happens to link through it.
  if (!isRoot && 'id' in record) return

  for (const [key, value] of Object.entries(record)) {
    walk(value, path ? `${path}.${key}` : key, onHit)
  }
}

for (const slug of collectionsToScan) {
  try {
    const docs = await payload.find({
      collection: slug as 'pages',
      depth: 1,
      limit: 1000,
      pagination: false,
    })

    for (const doc of docs.docs) {
      const record = doc as unknown as Record<string, unknown>
      const label = String(record.title ?? record.name ?? record.slug ?? record.id)

      walk(record, '', (fieldPath, id) => {
        references.push({
          collection: slug,
          doc: label,
          field: fieldPath,
          media: brokenIds.get(id)!.filename,
        })
      }, true)
    }
  } catch (error) {
    console.log(`  (skipped ${slug}: ${(error as Error).message.split('\n')[0]})`)
  }
}

// Globals too — the header/footer logos live there.
for (const global of payload.config.globals) {
  try {
    const doc = await payload.findGlobal({ slug: global.slug as 'header', depth: 1 })
    walk(doc as unknown as Record<string, unknown>, '', (fieldPath, id) => {
      references.push({
        collection: `global:${global.slug}`,
        doc: global.slug,
        field: fieldPath,
        media: brokenIds.get(id)!.filename,
      })
    }, true)
  } catch {
    // Not every global has been populated yet.
  }
}

if (broken.length) {
  console.log('--- broken media ---')
  for (const b of broken) console.log(`  [${b.status}] ${b.filename} (id ${b.id})`)
}

console.log(`\n--- documents referencing broken media (${references.length}) ---`)
for (const r of references.sort((a, b) => a.collection.localeCompare(b.collection))) {
  console.log(`  ${r.collection} :: ${r.doc}`)
  console.log(`      ${r.field}  ->  ${r.media}`)
}

const unreferenced = broken.filter((b) => !references.some((r) => r.media === b.filename))
if (unreferenced.length) {
  console.log(`\n--- broken but unreferenced (safe to delete: ${unreferenced.length}) ---`)
  for (const b of unreferenced) console.log(`  ${b.filename}`)
}

await payload.db.destroy?.()
