import { existsSync } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import dotenv from 'dotenv'

dotenv.config()

const requireFromProject = createRequire(import.meta.url)
const storagePluginEntryPath = requireFromProject.resolve('@payloadcms/storage-vercel-blob')
const requireFromStoragePlugin = createRequire(storagePluginEntryPath)
const vercelBlobPath = requireFromStoragePlugin.resolve('@vercel/blob')
const { put } = await import(pathToFileURL(vercelBlobPath).href)

const roots = ['media', 'brochures', 'three-d-assets']
const token = process.env.BLOB_READ_WRITE_TOKEN
const dryRun = process.argv.includes('--dry-run')

const contentTypes = new Map([
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json'],
  ['.hdr', 'image/vnd.radiance'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])

async function listFiles(root) {
  if (!existsSync(root)) return []

  const entries = await readdir(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

function toBlobPathname(filePath) {
  return path.basename(filePath)
}

async function main() {
  if (!token && !dryRun) {
    throw new Error('BLOB_READ_WRITE_TOKEN is required. Add it to .env or your shell env.')
  }

  const files = (await Promise.all(roots.map(listFiles))).flat()

  if (!files.length) {
    console.log('No local upload files found.')
    return
  }

  console.log(`${dryRun ? 'Would upload' : 'Uploading'} ${files.length} files to Vercel Blob...`)

  for (const filePath of files) {
    const { size } = await stat(filePath)
    const pathname = toBlobPathname(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = contentTypes.get(ext) ?? 'application/octet-stream'

    if (dryRun) {
      console.log(`- ${pathname} (${size} bytes, ${contentType})`)
      continue
    }

    const body = await readFile(filePath)
    const result = await put(pathname, body, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      contentType,
      multipart: size > 4 * 1024 * 1024,
      token,
    })

    console.log(`- ${result.pathname}`)
  }
}

main().catch((error) => {
  if (
    error instanceof Error &&
    error.message.includes('Cannot use public access on a private store')
  ) {
    console.error(
      [
        'This Blob store is private, but Payload media needs a public Vercel Blob store.',
        'Create/connect a public Blob store in Vercel, update BLOB_READ_WRITE_TOKEN, then run:',
        '  pnpm run sync:blob',
      ].join('\n'),
    )
    process.exitCode = 1
    process.exit()
  }

  console.error(error)
  process.exitCode = 1
})
