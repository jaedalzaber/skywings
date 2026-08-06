/**
 * Cross-references every Payload media/brochure/3D document against what
 * actually exists in Cloudinary, so missing assets can be named precisely.
 *
 *   node scripts/audit-media.mjs
 */
import process from 'node:process'

import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  secure: true,
})

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:3000'

async function cloudinaryPublicIds() {
  const ids = new Set()

  for (const resourceType of ['image', 'raw', 'video']) {
    let nextCursor

    do {
      const res = await cloudinary.api.resources({
        max_results: 500,
        next_cursor: nextCursor,
        prefix: 'skywings/',
        resource_type: resourceType,
        type: 'upload',
      })
      for (const r of res.resources) ids.add(`${resourceType}:${r.public_id}`)
      nextCursor = res.next_cursor
    } while (nextCursor)
  }

  return ids
}

const imageExtensionPattern = /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i
const videoExtensionPattern = /\.(m4v|mov|mp4|ogv|webm)$/i

function locate(filename, collectionSlug) {
  const resourceType = imageExtensionPattern.test(filename)
    ? 'image'
    : videoExtensionPattern.test(filename)
      ? 'video'
      : 'raw'
  const base = resourceType === 'raw' ? filename : filename.replace(/\.[^./\\]+$/, '')

  return `${resourceType}:skywings/${collectionSlug}/${base}`
}

async function fetchDocs(collectionSlug) {
  const res = await fetch(`${BASE}/api/${collectionSlug}?limit=500&depth=0`)
  if (!res.ok) throw new Error(`${collectionSlug}: ${res.status} — is the dev server running?`)
  const json = await res.json()
  return json.docs || []
}

const present = await cloudinaryPublicIds()
let missingTotal = 0

for (const collectionSlug of ['media', 'brochures', 'three-d-assets']) {
  const docs = await fetchDocs(collectionSlug)
  const missing = docs.filter((doc) => doc.filename && !present.has(locate(doc.filename, collectionSlug)))

  console.log(`\n=== ${collectionSlug}: ${docs.length} docs, ${missing.length} missing in Cloudinary ===`)
  for (const doc of missing) {
    console.log(`  ${doc.filename}   (${doc.mimeType || 'unknown type'})`)
  }
  missingTotal += missing.length
}

console.log(`\n${missingTotal} document(s) reference a file that is not in Cloudinary.`)
