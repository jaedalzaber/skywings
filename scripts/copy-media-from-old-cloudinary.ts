/**
 * Copies files the new Cloudinary account is missing from the old account,
 * by downloading each one from the old account's public delivery URL and
 * uploading it under the same public ID.
 *
 * The old account needs no credentials: delivery URLs are public. Run it after
 * scripts/upload-media-to-cloudinary.ts, for the files no computer holds.
 *
 *   OLD_CLOUDINARY_CLOUD_NAME=xtitj4ui DRY_RUN=1 pnpm payload run scripts/copy-media-from-old-cloudinary.ts
 *   OLD_CLOUDINARY_CLOUD_NAME=xtitj4ui pnpm payload run scripts/copy-media-from-old-cloudinary.ts
 *
 * Checks existence with a real GET, not HEAD: Cloudinary answered HEAD with
 * 404 for files that download perfectly well, which once made dozens of files
 * look lost when they were not.
 */
import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'
import { getPayload } from 'payload'

import {
  freePlanMaxBytes,
  resolveFolder,
  resolvePublicId,
  resolveResourceType,
} from '../src/storage/cloudinary/resource'

const OLD = process.env.OLD_CLOUDINARY_CLOUD_NAME
const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const COLLECTIONS = ['media', 'brochures', 'three-d-assets'] as const
const ROOT_FOLDER = 'skywings'

if (!OLD) throw new Error('Set OLD_CLOUDINARY_CLOUD_NAME to the account to copy from.')
const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = process.env
if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !CLOUDINARY_CLOUD_NAME) {
  throw new Error('Set the new account in CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.')
}
cloudinary.config({ api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, cloud_name: CLOUDINARY_CLOUD_NAME, secure: true })

async function existingInNewAccount() {
  const ids = new Set<string>()
  for (const resourceType of ['image', 'video', 'raw'] as const) {
    let cursor: string | undefined
    do {
      const page = await cloudinary.api.resources({ max_results: 500, next_cursor: cursor, prefix: `${ROOT_FOLDER}/`, resource_type: resourceType, type: 'upload' })
      for (const asset of page.resources as { public_id: string }[]) ids.add(`${resourceType}:${asset.public_id}`)
      cursor = page.next_cursor
    } while (cursor)
  }
  return ids
}

function uploadBuffer(buffer: Buffer, publicId: string, resourceType: 'image' | 'raw' | 'video') {
  return new Promise<void>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { invalidate: true, overwrite: true, public_id: publicId, resource_type: resourceType, unique_filename: false, use_filename: false },
        (error) => (error ? reject(error) : resolve()),
      )
      .end(buffer)
  })
}

const payload = await getPayload({ config })
const existing = await existingInNewAccount()

const copied: string[] = []
const unavailable: string[] = []
const failed: string[] = []

for (const collection of COLLECTIONS) {
  const { docs } = await payload.find({ collection, depth: 0, limit: 5000, overrideAccess: true, pagination: false })
  const folder = resolveFolder({ collectionSlug: collection, prefix: undefined, rootFolder: ROOT_FOLDER })

  for (const doc of docs as { filename?: null | string }[]) {
    if (!doc.filename) continue
    const resourceType = resolveResourceType({ filename: doc.filename })
    const publicId = resolvePublicId({ filename: doc.filename, folder, resourceType })
    if (existing.has(`${resourceType}:${publicId}`)) continue

    const extension = resourceType === 'raw' ? '' : `.${doc.filename.split('.').pop()}`
    const url = `https://res.cloudinary.com/${OLD}/${resourceType}/upload/${publicId.split('/').map(encodeURIComponent).join('/')}${extension}`

    const response = await fetch(url).catch(() => null)
    if (!response?.ok) {
      unavailable.push(`${collection}/${doc.filename} (${response?.status ?? 'network error'})`)
      continue
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length > freePlanMaxBytes[resourceType]) {
      failed.push(`${collection}/${doc.filename}: ${(buffer.length / 1048576).toFixed(1)} MB exceeds the plan limit`)
      continue
    }

    if (dryRun) {
      copied.push(`${collection}/${doc.filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
      continue
    }
    try {
      await uploadBuffer(buffer, publicId, resourceType)
      copied.push(`${collection}/${doc.filename}`)
    } catch (error) {
      failed.push(`${collection}/${doc.filename}: ${(error as { message?: string }).message ?? error}`)
    }
  }
}

console.log(`${dryRun ? '[dry run] would copy' : 'Copied'} ${copied.length} from "${OLD}" to "${CLOUDINARY_CLOUD_NAME}".`)
for (const line of copied) console.log(`  + ${line}`)
if (failed.length) console.log(`\nFailed:\n  ${failed.join('\n  ')}`)
if (unavailable.length) console.log(`\nNot in the old account either:\n  ${unavailable.join('\n  ')}`)
process.exit(failed.length ? 1 : 0)
