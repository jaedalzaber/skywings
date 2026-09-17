import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })
const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString()
const { docs } = await payload.find({ collection: 'media', depth: 0, limit: 50, overrideAccess: true, sort: '-createdAt', where: { createdAt: { greater_than: since } } })
for (const m of docs as Record<string, unknown>[]) {
  const file = path.join(process.cwd(), 'media', String(m.filename))
  const onDisk = existsSync(file) ? `${Math.round(statSync(file).size / 1024)}KB on disk` : 'MISSING on disk'
  console.log(`#${m.id} ${String(m.createdAt).slice(11, 19)} ${m.filename} | ${m.mimeType} | ${m.filesize} bytes | ${m.width}x${m.height} | ${onDisk}`)
}
process.exit(0)
