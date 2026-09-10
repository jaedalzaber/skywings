/**
 * Sets capability process photos, capability "typical output" thumbnails, and
 * machine photos from a folder of exported Figma images, matched by slug/label
 * rather than hardcoded — so it stays correct if a capability or machine is
 * renamed or added later.
 *
 * Expected folder layout (see docs/capability-images-export.md for the exact
 * file list with every current capability/machine/output name):
 *
 *   <root>/
 *     <capability-slug>/
 *       process.(png|jpg|jpeg|webp)        -> Capabilities.featuredImage
 *       outputs/
 *         <output-label-slugified>.(png|jpg|jpeg|webp)
 *                                           -> matching entry in
 *                                              Capabilities.typicalOutputs[].image
 *     machines/
 *       <machine-slug>.(png|jpg|jpeg|webp) -> Machines.featuredImage
 *
 * A capability/machine with no matching file, or an output label with no
 * matching file, is left untouched and reported at the end.
 *
 * Idempotent: a slot whose current image already has the same bytes is
 * skipped, and an identical file already in Media is reused instead of
 * uploaded again.
 *
 *   CAPABILITY_IMAGES_DIR="C:\path\to\folder" pnpm run seed:capability-images
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

import type { Capability, Machine, Media } from '@/payload-types'

const ROOT = process.env.CAPABILITY_IMAGES_DIR

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i

const sha1 = (buffer: Buffer) => createHash('sha1').update(buffer).digest('hex')

const labelKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function findImageFile(dir: string, baseName: string): Promise<string | null> {
  if (!existsSync(dir)) return null

  const entries = await readdir(dir, { withFileTypes: true })
  const match = entries.find(
    (entry) => entry.isFile() && path.parse(entry.name).name === baseName && IMAGE_EXTENSIONS.test(entry.name),
  )

  return match ? path.join(dir, match.name) : null
}

async function listImageFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []

  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
}

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
  if (!ROOT) throw new Error('Set CAPABILITY_IMAGES_DIR to the folder of exported images.')

  const payload = await getPayload({ config })

  const [{ docs: capabilities }, { docs: machines }, { docs: media }] = await Promise.all([
    payload.find({ collection: 'capabilities', depth: 0, overrideAccess: true, pagination: false }),
    payload.find({ collection: 'machines', depth: 0, overrideAccess: true, pagination: false }),
    payload.find({ collection: 'media', depth: 0, overrideAccess: true, pagination: false }),
  ])

  let updated = 0
  let unchanged = 0
  const missing: string[] = []

  /** Uploads `filePath` if it isn't already the value at doc[field], reusing an identical Media doc when one exists. */
  async function setImageIfChanged(args: {
    alt: string
    collection: 'capabilities' | 'machines'
    current: Media | null
    field: string
    filePath: string
    id: number
    label: string
  }): Promise<boolean> {
    const buffer = await readFile(args.filePath)
    const hash = sha1(buffer)

    if (
      args.current &&
      args.current.filesize === buffer.byteLength &&
      sha1((await mediaBytes(args.current)) ?? Buffer.alloc(0)) === hash
    ) {
      unchanged += 1
      return false
    }

    let mediaId: number | null = null
    for (const doc of media.filter((m) => m.filesize === buffer.byteLength)) {
      const bytes = await mediaBytes(doc)
      if (bytes && sha1(bytes) === hash) {
        mediaId = doc.id
        break
      }
    }

    if (dryRun) {
      console.log(
        `  would set ${args.label} <- ${path.basename(args.filePath)}${mediaId ? ` (reusing media ${mediaId})` : ''}`,
      )
      return true
    }

    if (!mediaId) {
      const created = await payload.create({
        collection: 'media',
        data: { alt: args.alt },
        filePath: args.filePath,
        overrideAccess: true,
      })
      mediaId = created.id
      media.push(created)
    }

    await payload.update({
      collection: args.collection,
      data: { [args.field]: mediaId },
      id: args.id,
      overrideAccess: true,
    })

    console.log(`  set  ${args.label} <- ${path.basename(args.filePath)} (media ${mediaId})`)
    return true
  }

  // Capability process photos + typical-output thumbnails.
  for (const capability of capabilities as Capability[]) {
    const dir = path.join(ROOT, capability.slug)

    const processFile = await findImageFile(dir, 'process')
    if (processFile) {
      const current = typeof capability.featuredImage === 'object' ? capability.featuredImage : null
      const changed = await setImageIfChanged({
        alt: `${capability.title} process photo`,
        collection: 'capabilities',
        current,
        field: 'featuredImage',
        filePath: processFile,
        id: capability.id,
        label: `${capability.slug} (process photo)`,
      })
      if (changed) updated += 1
    } else {
      missing.push(`${capability.slug}/process.*`)
    }

    const outputsDir = path.join(dir, 'outputs')
    const outputFiles = await listImageFiles(outputsDir)
    const outputs = capability.typicalOutputs ?? []
    const byKey = new Map(outputFiles.map((file) => [labelKey(path.parse(file).name), file]))
    let outputsChanged = false

    for (const output of outputs) {
      const file = byKey.get(labelKey(output.label))
      if (!file) {
        missing.push(`${capability.slug}/outputs/${output.label}`)
        continue
      }

      const current = typeof output.image === 'object' ? output.image : null
      const buffer = await readFile(file)
      const hash = sha1(buffer)
      const same =
        current &&
        current.filesize === buffer.byteLength &&
        sha1((await mediaBytes(current)) ?? Buffer.alloc(0)) === hash

      if (same) {
        unchanged += 1
        continue
      }

      let mediaId: number | null = null
      for (const doc of media.filter((m) => m.filesize === buffer.byteLength)) {
        const bytes = await mediaBytes(doc)
        if (bytes && sha1(bytes) === hash) {
          mediaId = doc.id
          break
        }
      }

      if (dryRun) {
        console.log(
          `  would set ${capability.slug}/outputs/${output.label} <- ${path.basename(file)}${mediaId ? ` (reusing media ${mediaId})` : ''}`,
        )
        outputsChanged = true
        updated += 1
        continue
      }

      if (!mediaId) {
        const created = await payload.create({
          collection: 'media',
          data: { alt: `${output.label} — ${capability.title} output` },
          filePath: file,
          overrideAccess: true,
        })
        mediaId = created.id
        media.push(created)
      }

      output.image = mediaId
      outputsChanged = true
      updated += 1
      console.log(`  set  ${capability.slug}/outputs/${output.label} <- ${path.basename(file)} (media ${mediaId})`)
    }

    if (outputsChanged && !dryRun) {
      await payload.update({
        collection: 'capabilities',
        data: { typicalOutputs: outputs },
        id: capability.id,
        overrideAccess: true,
      })
    }
  }

  // Machine photos.
  const machinesDir = path.join(ROOT, 'machines')
  for (const machine of machines as Machine[]) {
    const file = await findImageFile(machinesDir, machine.slug)
    if (!file) {
      missing.push(`machines/${machine.slug}`)
      continue
    }

    const current = typeof machine.featuredImage === 'object' ? machine.featuredImage : null
    const changed = await setImageIfChanged({
      alt: `${machine.name} photo`,
      collection: 'machines',
      current,
      field: 'featuredImage',
      filePath: file,
      id: machine.id,
      label: `machines/${machine.slug}`,
    })
    if (changed) updated += 1
  }

  console.log(`\n${dryRun ? 'Dry run: ' : ''}${updated} updated, ${unchanged} already current.`)

  if (missing.length) {
    console.log(`\n${missing.length} slot(s) with no matching file:`)
    for (const line of missing) console.log(`  ${line}`)
  }

  await payload.db.destroy?.()
}
