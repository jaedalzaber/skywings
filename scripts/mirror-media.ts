/**
 * Makes the deployment carry a verified copy of every uploaded file so the
 * site can serve it locally instead of from Cloudinary, whose free plan meters
 * delivery bandwidth against a monthly credit quota.
 *
 * - media: copied into public/media/ and served as static files. Files
 *   identical to one already in public/ (public/images/, the hero video in
 *   public/videos/, or an earlier duplicate upload) point there instead of
 *   being stored twice.
 * - brochures, three-d-assets: kept in their committed upload folders and
 *   served through Payload's file route, which still enforces `isPublic`.
 *
 * A local file only counts if its size matches the Cloudinary object's; a
 * mismatch means it was replaced upstream, so the current bytes are
 * downloaded -- a one-off cost, far cheaper than serving them on every view.
 * Files Cloudinary never had are used as-is.
 *
 * Writes src/storage/local-delivery-manifest.json, which the Cloudinary adapter
 * reads to decide what to serve locally. Anything not in it (uploads made after
 * the last run, or files missing everywhere) keeps being served from
 * Cloudinary, so re-run this after uploading or replacing files.
 *
 *   pnpm run mirror:media:dry-run
 *   pnpm run mirror:media
 *
 * `payload run` strips arguments after the script path, so the dry run is
 * selected with the DRY_RUN env var.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'
import { getPayload } from 'payload'

import type { LocalDeliveryManifest } from '@/storage/localDelivery'
import { resolveFolder, resolvePublicId, resolveResourceType } from '@/storage/cloudinary/resource'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const PUBLIC_MEDIA_DIR = path.join(PUBLIC_DIR, 'media')
const MANIFEST_PATH = path.join(ROOT, 'src', 'storage', 'local-delivery-manifest.json')
const ROOT_FOLDER = 'skywings'

const COLLECTIONS = ['media', 'brochures', 'three-d-assets'] as const
type CollectionSlug = (typeof COLLECTIONS)[number]

/** GitHub rejects files over 100 MB; anything that large stays on Cloudinary. */
const MAX_BYTES = 95 * 1024 * 1024

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

const sha1 = (buffer: Buffer) => createHash('sha1').update(buffer).digest('hex')

const toPublicUrl = (filePath: string) =>
  '/' +
  path
    .relative(PUBLIC_DIR, filePath)
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []

  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(full)))
    else if (entry.isFile()) files.push(full)
  }

  return files
}

/** `<resourceType>:<publicId>` -> byte size, for everything under the root folder. */
async function cloudinarySizes() {
  const sizes = new Map<string, number>()

  for (const resourceType of ['image', 'raw', 'video']) {
    let nextCursor: string | undefined

    do {
      const res = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: nextCursor,
        prefix: `${ROOT_FOLDER}/`,
        resource_type: resourceType,
        type: 'upload',
      })
      for (const r of res.resources) sizes.set(`${resourceType}:${r.public_id}`, r.bytes)
      nextCursor = res.next_cursor
    } while (nextCursor)
  }

  return sizes
}

function locate(collectionSlug: CollectionSlug, filename: string) {
  const resourceType = resolveResourceType({ filename })
  const publicId = resolvePublicId({
    filename,
    folder: resolveFolder({ collectionSlug, rootFolder: ROOT_FOLDER }),
    resourceType,
  })

  return {
    key: `${resourceType}:${publicId}`,
    url: cloudinary.url(publicId, {
      format: resourceType === 'raw' ? undefined : filename.split('.').pop(),
      resource_type: resourceType,
      secure: true,
      type: 'upload',
    }),
  }
}

async function readIfExists(filePath: string) {
  return existsSync(filePath) ? readFile(filePath) : null
}

// Top-level await, not a floating `main().catch()`: `payload run` tears the
// process down once module evaluation settles, which would cut the work short.
{
  cloudinary.config({
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    secure: true,
  })

  const payload = await getPayload({ config })
  const upstreamSizes = await cloudinarySizes()
  const previous: LocalDeliveryManifest | null = existsSync(MANIFEST_PATH)
    ? JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
    : null

  // Content hash -> public URL, for every file public/ already ships outside
  // public/media/. Media files join it as they're written, so duplicate
  // uploads share one copy.
  const publicFiles = new Map<string, string>()
  for (const filePath of await listFiles(PUBLIC_DIR)) {
    if (filePath.startsWith(PUBLIC_MEDIA_DIR + path.sep)) continue
    publicFiles.set(sha1(await readFile(filePath)), toPublicUrl(filePath))
  }

  const manifest: LocalDeliveryManifest = { publicFiles: { media: {} }, uploadDirFiles: {} }
  const writtenMedia = new Set<string>()
  const missing: string[] = []
  let total = 0

  if (!dryRun) await mkdir(PUBLIC_MEDIA_DIR, { recursive: true })

  for (const collectionSlug of COLLECTIONS) {
    const { docs } = await payload.find({
      collection: collectionSlug,
      depth: 0,
      overrideAccess: true,
      pagination: false,
      select: { filename: true },
    })
    const uploadDir = path.join(ROOT, collectionSlug)
    const served: string[] = []
    const counts = { downloaded: 0, local: 0, reused: 0 }

    console.log(`\n${collectionSlug} (${docs.length} documents)`)

    for (const { filename } of docs) {
      if (!filename) continue
      total += 1

      const { key, url } = locate(collectionSlug, filename)
      const upstreamSize = upstreamSizes.get(key)
      const uploadDirPath = path.join(uploadDir, filename)
      // media/ is the gitignored legacy upload folder, so after the first run
      // the committed public/ copy is the one most checkouts have.
      const previousUrl = previous?.publicFiles.media[filename]
      const candidates =
        collectionSlug === 'media'
          ? [
              ...(previousUrl ? [path.join(PUBLIC_DIR, ...previousUrl.split('/').map(decodeURIComponent))] : []),
              path.join(PUBLIC_MEDIA_DIR, filename),
              uploadDirPath,
            ]
          : [uploadDirPath]

      let buffer: Buffer | null = null
      for (const candidate of candidates) {
        const local = await readIfExists(candidate)
        if (local && (upstreamSize === undefined || local.byteLength === upstreamSize)) {
          buffer = local
          break
        }
      }

      if (buffer) {
        counts.local += 1
      } else if (upstreamSize === undefined) {
        missing.push(`${collectionSlug}/${filename} — not in Cloudinary or locally`)
        continue
      } else if (upstreamSize > MAX_BYTES) {
        missing.push(`${collectionSlug}/${filename} — ${(upstreamSize / 1024 / 1024).toFixed(1)} MB, too large for git`)
        continue
      } else {
        const res = await fetch(url)
        if (!res.ok) {
          missing.push(`${collectionSlug}/${filename} — Cloudinary ${res.status}`)
          continue
        }
        buffer = Buffer.from(await res.arrayBuffer())
        counts.downloaded += 1
        console.log(`  download ${filename}`)

        // brochures/ and three-d-assets/ are committed; refresh them in place.
        if (collectionSlug !== 'media' && !dryRun) {
          await mkdir(uploadDir, { recursive: true })
          await writeFile(uploadDirPath, buffer)
        }
      }

      if (collectionSlug !== 'media') {
        served.push(filename)
        continue
      }

      const hash = sha1(buffer)
      const existing = publicFiles.get(hash)
      if (existing) {
        manifest.publicFiles.media[filename] = existing
        counts.reused += 1
        continue
      }

      const target = path.join(PUBLIC_MEDIA_DIR, filename)
      manifest.publicFiles.media[filename] = toPublicUrl(target)
      publicFiles.set(hash, manifest.publicFiles.media[filename])
      writtenMedia.add(filename)
      if (!dryRun) await writeFile(target, buffer)
    }

    if (collectionSlug !== 'media') manifest.uploadDirFiles[collectionSlug] = served.sort()

    console.log(
      `  ${counts.local} verified locally, ${counts.downloaded} downloaded` +
        (collectionSlug === 'media' ? `, ${counts.reused} reusing an identical public file` : ''),
    )
  }

  // public/media/ belongs to this script: drop files no document uses anymore.
  for (const filePath of await listFiles(PUBLIC_MEDIA_DIR)) {
    if (writtenMedia.has(path.relative(PUBLIC_MEDIA_DIR, filePath))) continue
    console.log(`  remove   ${path.relative(ROOT, filePath)} — no longer referenced`)
    if (!dryRun) await rm(filePath)
  }

  manifest.publicFiles.media = Object.fromEntries(
    Object.entries(manifest.publicFiles.media).sort(([a], [b]) => a.localeCompare(b)),
  )
  if (!dryRun) await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)

  const localCount =
    Object.keys(manifest.publicFiles.media).length +
    Object.values(manifest.uploadDirFiles).reduce((sum, files) => sum + (files?.length ?? 0), 0)

  console.log(`\n${dryRun ? 'Dry run: would serve' : 'Serving'} ${localCount} of ${total} files locally.`)

  if (missing.length) {
    console.log(`\n${missing.length} file(s) stay on Cloudinary:`)
    for (const line of missing) console.log(`  ${line}`)
  }

  await payload.db.destroy?.()
}
