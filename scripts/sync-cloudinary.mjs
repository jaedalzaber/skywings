/**
 * Uploads local upload folders to Cloudinary, mirroring the folder layout the
 * Payload adapter expects (`<rootFolder>/<collection>/<file>`).
 *
 * Run after restoring any missing originals into media/, brochures/ or
 * three-d-assets/. Safe to re-run: uploads overwrite in place, so it can be
 * used repeatedly as more originals turn up.
 *
 *   pnpm run sync:cloudinary --dry-run
 *   pnpm run sync:cloudinary
 */
import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

const ROOT_FOLDER = 'skywings'

/** Local folder -> Payload collection slug. Must match payload.config.ts. */
const COLLECTION_DIRS = {
  brochures: 'brochures',
  media: 'media',
  'three-d-assets': 'three-d-assets',
}

const imageExtensionPattern = /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i
const videoExtensionPattern = /\.(m4v|mov|mp4|ogv|webm)$/i

const maxBytes = { image: 10 * 1024 * 1024, raw: 10 * 1024 * 1024, video: 100 * 1024 * 1024 }

const dryRun = process.argv.includes('--dry-run')

function resolveResourceType(filename) {
  if (imageExtensionPattern.test(filename)) return 'image'
  if (videoExtensionPattern.test(filename)) return 'video'
  return 'raw'
}

function resolvePublicId(filename, folder, resourceType) {
  const base = resourceType === 'raw' ? filename : filename.replace(/\.[^./\\]+$/, '')
  return `${folder}/${base}`
}

async function listFiles(root) {
  if (!existsSync(root)) return []

  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath)))
    else if (entry.isFile()) files.push(fullPath)
  }

  return files
}

function uploadBuffer(buffer, publicId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        invalidate: true,
        overwrite: true,
        public_id: publicId,
        resource_type: resourceType,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) reject(error)
        else if (!result) reject(new Error('Cloudinary upload returned no result.'))
        else resolve(result)
      },
    )
    stream.end(buffer)
  })
}

async function main() {
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } = process.env

  if (!dryRun && !(CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET && CLOUDINARY_CLOUD_NAME)) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required. Add them to .env.',
    )
  }

  cloudinary.config({
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    cloud_name: CLOUDINARY_CLOUD_NAME,
    secure: true,
  })

  const oversized = []
  let uploaded = 0

  for (const [dir, collectionSlug] of Object.entries(COLLECTION_DIRS)) {
    const files = await listFiles(dir)
    if (!files.length) {
      console.log(`${dir}/: no local files`)
      continue
    }

    console.log(`\n${dir}/ -> ${ROOT_FOLDER}/${collectionSlug} (${files.length} files)`)

    for (const filePath of files) {
      const filename = path.basename(filePath)

      // Artifacts from `pnpm run compress:glb` without --replace. Uploading
      // them would create a second asset the Payload documents never
      // reference.
      if (/\.compressed\.glb$/i.test(filename)) {
        console.log(`  skip ${filename} — compression artifact, run compress:glb --replace first`)
        continue
      }

      const { size } = await stat(filePath)
      const resourceType = resolveResourceType(filename)
      const publicId = resolvePublicId(filename, `${ROOT_FOLDER}/${collectionSlug}`, resourceType)

      if (size > maxBytes[resourceType]) {
        oversized.push({ filename, resourceType, size })
        console.log(
          `  SKIP ${filename} — ${(size / 1024 / 1024).toFixed(1)} MB exceeds the ${(
            maxBytes[resourceType] /
            1024 /
            1024
          ).toFixed(0)} MB ${resourceType} limit`,
        )
        continue
      }

      if (dryRun) {
        console.log(`  would upload ${filename} -> ${publicId} (${resourceType})`)
        continue
      }

      await uploadBuffer(await readFile(filePath), publicId, resourceType)
      uploaded += 1
      console.log(`  ${filename} -> ${publicId}`)
    }
  }

  console.log(`\n${dryRun ? 'Dry run complete.' : `Uploaded ${uploaded} files.`}`)

  if (oversized.length) {
    console.log(`\n${oversized.length} file(s) exceeded the plan limit and were skipped:`)
    for (const file of oversized) {
      console.log(`  ${file.filename} (${(file.size / 1024 / 1024).toFixed(1)} MB, ${file.resourceType})`)
    }
    console.log('\nFor GLB files, run: pnpm run compress:glb')
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
