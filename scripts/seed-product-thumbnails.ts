/**
 * Sets product card thumbnails from a folder of images named after the
 * product: either its SKU / model number (GSE-3CD-008.png) or its title
 * ("Shafts and rollers.png"). Titles match case-insensitively, with "&" and
 * "and" treated alike.
 *
 * Idempotent: a product whose thumbnail already has the same bytes is
 * skipped, and an identical file already in Media is reused instead of
 * uploaded again.
 *
 *   THUMBS_DIR="C:\path\to\folder" pnpm run seed:product-thumbnails
 *   (add DRY_RUN=1 to preview)
 *
 * New uploads land in Cloudinary; run `pnpm run mirror:media` afterwards so
 * they're served from public/ like the rest.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Media } from '@/payload-types'

const SOURCE_DIR = process.env.THUMBS_DIR

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

/** File names that don't match their product's SKU exactly. */
const SKU_ALIASES: Record<string, string> = {
  // Typo in the source file; the image is the propeller stand.
  'GSE-PSQ-042': 'GSE-PSD-042',
}

/** Anything this small is a text label with the model code, not a photo. */
const PLACEHOLDER_MAX_BYTES = 4 * 1024

const sha1 = (buffer: Buffer) => createHash('sha1').update(buffer).digest('hex')

const titleKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function mediaBytes(doc: Media): Promise<Buffer | null> {
  if (!doc.url) return null

  if (doc.url.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', ...doc.url.split('/').map(decodeURIComponent))
    return existsSync(filePath) ? readFile(filePath) : null
  }

  const res = await fetch(doc.url)
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null
}

// Top-level await: `payload run` exits once module evaluation settles.
{
  if (!SOURCE_DIR) throw new Error('Set THUMBS_DIR to the folder of thumbnail images.')

  const payload = await getPayload({ config })

  const { docs: products } = await payload.find({
    collection: 'products',
    depth: 1,
    overrideAccess: true,
    pagination: false,
    select: { sku: true, thumbnailImage: true, title: true },
  })
  const productBySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku!.toUpperCase(), p]))
  const productByTitle = new Map(products.map((p) => [titleKey(p.title), p]))

  const findProduct = (file: string) => {
    const name = path.parse(file).name
    const sku = SKU_ALIASES[name.toUpperCase()] ?? name.toUpperCase()
    return productBySku.get(sku) ?? productByTitle.get(titleKey(name))
  }

  const { docs: media } = await payload.find({
    collection: 'media',
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })

  const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()
  const unmatched: string[] = []
  const placeholders: string[] = []
  const replaced: string[] = []
  let updated = 0
  let unchanged = 0

  for (const file of files) {
    const product = findProduct(file)
    const label = product ? `${product.sku ?? product.id} ${product.title}` : ''

    if (!product) {
      unmatched.push(file)
      continue
    }

    const filePath = path.join(SOURCE_DIR, file)
    const buffer = await readFile(filePath)

    if (buffer.byteLength <= PLACEHOLDER_MAX_BYTES) {
      placeholders.push(`${file} (${label})`)
      continue
    }

    const hash = sha1(buffer)
    const current = typeof product.thumbnailImage === 'object' ? product.thumbnailImage : null

    if (
      current &&
      current.filesize === buffer.byteLength &&
      sha1((await mediaBytes(current)) ?? Buffer.alloc(0)) === hash
    ) {
      unchanged += 1
      continue
    }

    // Reuse an identical Media file if one exists, so re-runs don't upload twice.
    let mediaId: number | null = null
    for (const doc of media.filter((m) => m.filesize === buffer.byteLength)) {
      const bytes = await mediaBytes(doc)
      if (bytes && sha1(bytes) === hash) {
        mediaId = doc.id
        break
      }
    }

    if (current) replaced.push(`${label}: ${current.filename} (media ${current.id}) -> ${file}`)

    if (dryRun) {
      console.log(`  would set ${label} <- ${file}${mediaId ? ` (reusing media ${mediaId})` : ''}`)
      continue
    }

    if (!mediaId) {
      const created = await payload.create({
        collection: 'media',
        data: { alt: product.title },
        filePath,
        overrideAccess: true,
      })
      mediaId = created.id
      media.push(created)
    }

    await payload.update({
      collection: 'products',
      data: { thumbnailImage: mediaId },
      id: product.id,
      overrideAccess: true,
    })

    updated += 1
    console.log(`  set  ${label} <- ${file} (media ${mediaId})`)
  }

  console.log(`\n${dryRun ? 'Dry run: ' : ''}${updated} updated, ${unchanged} already current.`)

  if (replaced.length) {
    console.log(`\nReplaced existing thumbnails (old media kept):`)
    for (const line of replaced) console.log(`  ${line}`)
  }
  if (placeholders.length) {
    console.log(`\nSkipped text-label placeholders:`)
    for (const line of placeholders) console.log(`  ${line}`)
  }
  if (unmatched.length) {
    console.log(`\nNo product with this SKU or title:`)
    for (const line of unmatched) console.log(`  ${line}`)
  }

  await payload.db.destroy?.()
}
