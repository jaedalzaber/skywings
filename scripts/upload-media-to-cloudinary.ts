/**
 * Uploads every stored file the database knows about to the Cloudinary
 * account in .env, under the exact public ID the storage adapter builds
 * (skywings/<collection>/<file>). Use it to fill a new account, or to push up
 * files that were only ever saved on one computer.
 *
 * Works from the documents, not from folders, so nothing a page points at is
 * left behind because it lives somewhere unexpected. For each media, brochure
 * and 3D asset record the file is looked for in:
 *
 *   1. its upload folder -- media/, brochures/, three-d-assets/ -- where
 *      uploads made without Cloudinary keys were written, and
 *   2. its mirrored copy under public/, via the local delivery manifest,
 *      which may be stored under a different name.
 *
 * A file already in the account with the same size is skipped, so the script
 * is safe to re-run -- on another computer that holds files this one does
 * not, for instance. Files over the free plan's limits are reported, not
 * uploaded. Files found nowhere are listed at the end.
 *
 *   pnpm run media:upload-cloudinary:dry-run
 *   pnpm run media:upload-cloudinary
 */
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'
import { getPayload } from 'payload'

import {
  freePlanMaxBytes,
  resolveFolder,
  resolvePublicId,
  resolveResourceType,
  type CloudinaryResourceType,
} from '../src/storage/cloudinary/resource'
import { localDeliveryManifest } from '../src/storage/localDelivery'

const COLLECTIONS = ['media', 'brochures', 'three-d-assets'] as const
const ROOT_FOLDER = 'skywings'
const CONCURRENCY = 4
const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = process.env
if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
  throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env first.')
}
cloudinary.config({
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  cloud_name: CLOUDINARY_CLOUD_NAME,
  secure: true,
})

type Job = {
  collection: string
  filename: string
  publicId: string
  resourceType: CloudinaryResourceType
  size: number
  source: string
}

/** What the account already holds, by resource type: public ID -> bytes. */
async function existingAssets() {
  const existing = new Map<string, number>()
  for (const resourceType of ['image', 'video', 'raw'] as const) {
    let cursor: string | undefined
    do {
      const page = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: cursor,
        prefix: `${ROOT_FOLDER}/`,
        resource_type: resourceType,
        type: 'upload',
      })
      for (const asset of page.resources as { bytes: number; public_id: string }[]) {
        existing.set(`${resourceType}:${asset.public_id}`, asset.bytes)
      }
      cursor = page.next_cursor
    } while (cursor)
  }
  return existing
}

/** The file's bytes on this computer, wherever they are. */
function findSource(collection: string, filename: string): string | null {
  const uploadDir = path.join(process.cwd(), collection, filename)
  if (existsSync(uploadDir)) return uploadDir

  const mirrored = localDeliveryManifest.publicFiles[collection]?.[filename]
  if (mirrored) {
    const publicPath = path.join(process.cwd(), 'public', ...mirrored.split('/').filter(Boolean).map(decodeURIComponent))
    if (existsSync(publicPath)) return publicPath
  }
  return null
}

function upload(job: Job) {
  return new Promise<void>((resolve, reject) => {
    readFile(job.source)
      .then((buffer) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            invalidate: true,
            overwrite: true,
            public_id: job.publicId,
            resource_type: job.resourceType,
            unique_filename: false,
            use_filename: false,
          },
          (error) => (error ? reject(error) : resolve()),
        )
        stream.end(buffer)
      })
      .catch(reject)
  })
}

const payload = await getPayload({ config })
const existing = await existingAssets()
console.log(`${dryRun ? '[dry run] ' : ''}Cloudinary account "${CLOUDINARY_CLOUD_NAME}" holds ${existing.size} skywings/ assets.`)

const jobs: Job[] = []
const skipped: string[] = []
const oversized: string[] = []
const notFound: string[] = []

for (const collection of COLLECTIONS) {
  const { docs } = await payload.find({ collection, depth: 0, limit: 5000, overrideAccess: true, pagination: false })
  const folder = resolveFolder({ collectionSlug: collection, prefix: undefined, rootFolder: ROOT_FOLDER })

  for (const doc of docs as { filename?: null | string; prefix?: null | string }[]) {
    if (!doc.filename) continue
    const filename = doc.filename
    const resourceType = resolveResourceType({ filename })
    const publicId = resolvePublicId({ filename, folder: doc.prefix ? resolveFolder({ collectionSlug: collection, prefix: doc.prefix, rootFolder: ROOT_FOLDER }) : folder, resourceType })

    const source = findSource(collection, filename)
    if (!source) {
      notFound.push(`${collection}/${filename}`)
      continue
    }

    const { size } = await stat(source)
    if (existing.get(`${resourceType}:${publicId}`) === size) {
      skipped.push(`${collection}/${filename}`)
      continue
    }
    if (size > freePlanMaxBytes[resourceType]) {
      oversized.push(`${collection}/${filename} (${(size / 1048576).toFixed(1)} MB, ${resourceType} limit ${freePlanMaxBytes[resourceType] / 1048576} MB)`)
      continue
    }
    jobs.push({ collection, filename, publicId, resourceType, size, source })
  }
}

const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`
console.log(`To upload: ${jobs.length} files, ${megabytes(jobs.reduce((sum, job) => sum + job.size, 0))}`)
console.log(`Already there: ${skipped.length} | Too large for the plan: ${oversized.length} | Not on this computer: ${notFound.length}`)

let done = 0
const failed: string[] = []
if (!dryRun) {
  const queue = [...jobs]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          await upload(job)
          done += 1
          if (done % 25 === 0 || done === jobs.length) console.log(`  uploaded ${done}/${jobs.length}`)
        } catch (error) {
          failed.push(`${job.collection}/${job.filename}: ${(error as { message?: string }).message ?? error}`)
        }
      }
    }),
  )
  console.log(`Uploaded ${done} of ${jobs.length}.${failed.length ? ` Failed: ${failed.length}` : ''}`)
}

if (oversized.length) console.log(`\nToo large for the free plan (not uploaded):\n  ${oversized.join('\n  ')}`)
if (failed.length) console.log(`\nFailed:\n  ${failed.join('\n  ')}`)
if (notFound.length) console.log(`\nNot on this computer (upload these from wherever the originals are):\n  ${notFound.join('\n  ')}`)

process.exit(failed.length ? 1 : 0)
