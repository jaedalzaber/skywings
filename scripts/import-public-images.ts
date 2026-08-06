/**
 * Imports public/images/** into the Media collection so each file gets a real
 * Payload document *and* a Cloudinary object — making them selectable in the
 * admin. Uploading straight to Cloudinary would not create the document, so
 * the assets would stay invisible to editors.
 *
 * The originals stay in public/images: they are the hardcoded `??` fallbacks
 * in HomeBlocks.tsx / home.ts and must keep working without a network round
 * trip.
 *
 * Idempotent — files whose filename already exists in Media are skipped, so
 * Payload never appends a `-1` dedup suffix on a re-run.
 *
 *   pnpm run import:images:dry-run
 *   pnpm run import:images
 *
 * Note: `payload run` strips every argument after the script path, so the dry
 * run is selected with the DRY_RUN env var, not a CLI flag.
 */
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

const SOURCE_DIR = path.join(process.cwd(), 'public', 'images')

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

/** "hero-desktop.png" -> "Hero desktop" */
function toAltText(filename: string, group: string): string {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()

  return `${group} ${base}`.replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(full)))
    else if (entry.isFile()) files.push(full)
  }

  return files
}

// Top-level await, not a floating `main().catch()`: `payload run` tears the
// process down once module evaluation settles, which would cut the work short.
{
  const payload = await getPayload({ config })
  const files = (await listFiles(SOURCE_DIR)).sort()

  console.log(`Found ${files.length} files under public/images\n`)

  let created = 0
  let skipped = 0

  for (const filePath of files) {
    const filename = path.basename(filePath)
    const group = path.basename(path.dirname(filePath))

    const existing = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      where: { filename: { equals: filename } },
    })

    if (existing.totalDocs > 0) {
      console.log(`  skip    ${group}/${filename} — already in Media (id ${existing.docs[0]!.id})`)
      skipped += 1
      continue
    }

    if (dryRun) {
      console.log(`  would import ${group}/${filename} — alt "${toAltText(filename, group)}"`)
      continue
    }

    const doc = await payload.create({
      collection: 'media',
      data: { alt: toAltText(filename, group) },
      filePath,
    })

    console.log(`  import  ${group}/${filename} -> media id ${doc.id}`)
    created += 1
  }

  console.log(
    `\n${dryRun ? 'Dry run complete.' : `Imported ${created} file(s).`} Skipped ${skipped} already present.`,
  )

  // Close the pool rather than calling process.exit(), which drops buffered
  // stdout when it is a pipe.
  await payload.db.destroy?.()
}
