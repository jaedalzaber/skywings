/**
 * One-off: applies the images exported 2026-09-10 from the Figma "Process
 * Capabilities" slides (see docs/capability-images-export.md) to the
 * Capabilities, Machines, and typical-output records.
 *
 * The export folder uses Figma's own layer names (e.g. "Group 178.png"),
 * not a naming convention a script can match automatically, so the mapping
 * below was built by opening each file and matching it to what it shows.
 * Two labels -- Radial & Heavy Drilling's "Platform connection plates" and
 * "Frame connection plates" -- had no distinct photo in the export and are
 * left unset.
 *
 *   CAPABILITY_IMAGES_DIR="C:\...\capabilities" pnpm run seed:capability-images-2026-09-10
 *   (add DRY_RUN=1 to preview)
 *
 * Idempotent: a slot whose current image already has the same bytes is
 * skipped, and an identical file already in Media is reused instead of
 * uploaded again. New uploads land in Cloudinary; run `pnpm run mirror:media`
 * afterwards so they're served from public/ like the rest.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Capability, Machine, Media } from '@/payload-types'

const ROOT = process.env.CAPABILITY_IMAGES_DIR

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

const sha1 = (buffer: Buffer) => createHash('sha1').update(buffer).digest('hex')

// Capability slug -> process photo (banners/).
const PROCESS_PHOTOS: Record<string, string> = {
  'laser-cutting': 'banners/Rectangle 243.png',
  shearing: 'banners/Rectangle 258.png',
  'cnc-and-conventional-machining': 'banners/Rectangle 243-1.png',
  'press-brake-forming': 'banners/Group 35.png',
  'plate-and-sheet-rolling': 'banners/Group 31.png',
  'radial-and-heavy-drilling': 'banners/Rectangle 265.png',
  'hydraulic-pressing': 'banners/Group 31-1.png',
}

// Machine slug -> photo (machines/).
const MACHINE_PHOTOS: Record<string, string> = {
  'bodor-c-series-laser': 'machines/Group 277.png',
  'vox-vp16032-shear': 'machines/Group 278.png',
  'weida-amt-63-cnc-lathe': 'machines/ChatGPT Image Jun 14, 2026, 04_39_25 PM 1.png',
  'conventional-lathe': 'machines/ChatGPT Image Jun 14, 2026, 04_46_52 PM 3.png',
  'heavy-duty-lathe-660x3000': 'machines/ChatGPT Image Jun 14, 2026, 04_58_01 PM 3.png',
  'universal-milling-machine': 'machines/ChatGPT Image Jun 14, 2026, 05_57_43 PM 3.png',
  'shaping-machine': 'machines/ChatGPT Image Jun 14, 2026, 06_10_25 PM 2.png',
  'radial-drilling-machine': 'machines/ChatGPT Image Jun 14, 2026, 06_18_16 PM 2.png',
  'hydraulic-press-j-mdy-100-30': 'machines/ChatGPT Image Jun 14, 2026, 06_34_50 PM 2.png',
  'vox-qc12y-8x3200-press-brake': 'machines/ChatGPT Image Jun 14, 2026, 07_29_09 PM 2 1.png',
  'plate-rolling-w11-8x3200': 'machines/ChatGPT Image Jun 14, 2026, 08_13_03 PM 2.png',
  'manual-sheet-rolling-machine': 'machines/ChatGPT Image Jun 14, 2026, 08_31_36 PM 2.png',
  'weida-amt-860-vmc': 'machines/ChatGPT Image Jun 14, 2026, 08_32_17 PM 2.png',
}

// Capability slug -> { output label -> photo (applications/) }.
const OUTPUT_PHOTOS: Record<string, Record<string, string>> = {
  'laser-cutting': {
    'Sheet metal blanks': 'applications/Rectangle 245.png',
    'Mounting brackets': 'applications/Group 189.png',
    'Structural connection plates': 'applications/Rectangle 252.png',
    'Cover plates': 'applications/Rectangle 251.png',
    'Ventilation panels': 'applications/Rectangle 257.png',
    'Complex geometries': 'applications/Rectangle 256.png',
  },
  shearing: {
    'Cut sheet blanks': 'applications/Group 178.png',
    'Steel strips & flat bars': 'applications/Rectangle 260.png',
    'Fabrication-ready plate sets': 'applications/Rectangle 264.png',
  },
  'cnc-and-conventional-machining': {
    'Keyway components': 'applications/Group 183.png',
    'Fixturing plates': 'applications/Group 185-2.png',
    'Mounting blocks': 'applications/Group 179.png',
    Flanges: 'applications/Group 180.png',
    'Turned shafts': 'applications/Group 181.png',
    'Threaded parts': 'applications/Group 185.png',
    'Fixtures & tooling': 'applications/Rectangle 250.png',
    'Pins & spacers': 'applications/Group 182.png',
    'Custom spare parts': 'applications/Group 184.png',
  },
  'press-brake-forming': {
    'Folded machine panels': 'applications/Group 185-1.png',
    'Precision bends': 'applications/Group 186.png',
    Enclosures: 'applications/Group 188.png',
    'L, Z, mounting & custom brackets': 'applications/Group 281.png',
  },
  'plate-and-sheet-rolling': {
    Tanks: 'applications/Group 191.png',
    'Pressure vessel shells': 'applications/Group 194.png',
    'Curved profiles': 'applications/Group 192.png',
    'Conveyor rollers': 'applications/Group 195.png',
  },
  'radial-and-heavy-drilling': {
    'Mounting plates': 'applications/Rectangle 259.png',
    'Pipe flanges': 'applications/Group 186-1.png',
    'Heavy parts fabrication': 'applications/Group 187.png',
    // 'Platform connection plates' and 'Frame connection plates': no distinct
    // photo in this export -- left unset rather than reusing an unrelated one.
  },
  'hydraulic-pressing': {
    'Deep drawn components': 'applications/Group 279.png',
    'Formed brackets & reinforcements': 'applications/Group 188-1.png',
    'Stamped panels': 'applications/Group 280.png',
  },
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
  if (!ROOT) throw new Error('Set CAPABILITY_IMAGES_DIR to the exported images folder.')

  const payload = await getPayload({ config })

  const [{ docs: capabilities }, { docs: machines }, { docs: media }] = await Promise.all([
    payload.find({ collection: 'capabilities', depth: 0, overrideAccess: true, pagination: false }),
    payload.find({ collection: 'machines', depth: 0, overrideAccess: true, pagination: false }),
    payload.find({ collection: 'media', depth: 0, overrideAccess: true, pagination: false }),
  ])
  const capabilityBySlug = new Map((capabilities as Capability[]).map((c) => [c.slug, c]))
  const machineBySlug = new Map((machines as Machine[]).map((m) => [m.slug, m]))

  let updated = 0
  let unchanged = 0
  const missingFiles: string[] = []

  /** Uploads the file at ROOT/relativePath if it differs from `current`, reusing an identical Media doc when one exists. */
  async function resolveMediaId(args: { alt: string; current: Media | null; label: string; relativePath: string }) {
    const filePath = path.join(ROOT!, args.relativePath)
    if (!existsSync(filePath)) {
      missingFiles.push(`${args.label}: ${args.relativePath} not found`)
      return undefined
    }

    const buffer = await readFile(filePath)
    const hash = sha1(buffer)

    if (
      args.current &&
      args.current.filesize === buffer.byteLength &&
      sha1((await mediaBytes(args.current)) ?? Buffer.alloc(0)) === hash
    ) {
      unchanged += 1
      return undefined
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
      console.log(`  would set ${args.label} <- ${args.relativePath}${mediaId ? ` (reusing media ${mediaId})` : ''}`)
      updated += 1
      return undefined
    }

    if (!mediaId) {
      const created = await payload.create({
        collection: 'media',
        data: { alt: args.alt },
        filePath,
        overrideAccess: true,
      })
      mediaId = created.id
      media.push(created)
    }

    console.log(`  set  ${args.label} <- ${args.relativePath} (media ${mediaId})`)
    updated += 1
    return mediaId
  }

  // Capability process photos.
  for (const [slug, relativePath] of Object.entries(PROCESS_PHOTOS)) {
    const capability = capabilityBySlug.get(slug)
    if (!capability) {
      missingFiles.push(`${slug}: no such capability`)
      continue
    }

    const current = typeof capability.featuredImage === 'object' ? capability.featuredImage : null
    const mediaId = await resolveMediaId({
      alt: `${capability.title} process photo`,
      current,
      label: `${slug} (process photo)`,
      relativePath,
    })
    if (mediaId !== undefined && !dryRun) {
      await payload.update({
        collection: 'capabilities',
        data: { featuredImage: mediaId },
        id: capability.id,
        overrideAccess: true,
      })
    }
  }

  // Typical-output thumbnails.
  for (const [slug, labels] of Object.entries(OUTPUT_PHOTOS)) {
    const capability = capabilityBySlug.get(slug)
    if (!capability) {
      missingFiles.push(`${slug}: no such capability`)
      continue
    }

    const outputs = capability.typicalOutputs ?? []
    let changed = false

    for (const [label, relativePath] of Object.entries(labels)) {
      const output = outputs.find((o) => o.label === label)
      if (!output) {
        missingFiles.push(`${slug}/${label}: no matching typicalOutputs row (label text may have changed)`)
        continue
      }

      const current = typeof output.image === 'object' ? output.image : null
      const mediaId = await resolveMediaId({
        alt: `${label} — ${capability.title} output`,
        current,
        label: `${slug}/${label}`,
        relativePath,
      })
      if (mediaId !== undefined) {
        if (!dryRun) output.image = mediaId
        changed = true
      }
    }

    if (changed && !dryRun) {
      await payload.update({
        collection: 'capabilities',
        data: { typicalOutputs: outputs },
        id: capability.id,
        overrideAccess: true,
      })
    }
  }

  // Machine photos.
  for (const [slug, relativePath] of Object.entries(MACHINE_PHOTOS)) {
    const machine = machineBySlug.get(slug)
    if (!machine) {
      missingFiles.push(`${slug}: no such machine`)
      continue
    }

    const current = typeof machine.featuredImage === 'object' ? machine.featuredImage : null
    const mediaId = await resolveMediaId({
      alt: `${machine.name} photo`,
      current,
      label: `machines/${slug}`,
      relativePath,
    })
    if (mediaId !== undefined && !dryRun) {
      await payload.update({
        collection: 'machines',
        data: { featuredImage: mediaId },
        id: machine.id,
        overrideAccess: true,
      })
    }
  }

  console.log(`\n${dryRun ? 'Dry run: ' : ''}${updated} updated, ${unchanged} already current.`)

  console.log(
    `\nNot set from this export (need a photo added by hand): ` +
      `radial-and-heavy-drilling/Platform connection plates, radial-and-heavy-drilling/Frame connection plates`,
  )

  if (missingFiles.length) {
    console.log(`\n${missingFiles.length} problem(s):`)
    for (const line of missingFiles) console.log(`  ${line}`)
  }

  await payload.db.destroy?.()
}
