import { existsSync } from 'node:fs'
import path from 'node:path'
import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })

const PROBE_ALTS = ['upload probe', 'http probe', 'http probe big', 'admin probe', 'drawer probe', 'industry drawer probe', 'drop probe']
const media = await payload.find({ collection: 'media', depth: 0, limit: 100, overrideAccess: true, where: { alt: { in: PROBE_ALTS } } })
for (const m of media.docs) {
  await payload.delete({ collection: 'media', id: m.id, overrideAccess: true })
  const file = path.join(process.cwd(), 'media', String(m.filename))
  console.log(`media #${m.id} ${m.filename} (${m.alt}) deleted; file left on disk: ${existsSync(file)}`)
}

const campaigns = await payload.find({ collection: 'newsletter-campaigns', depth: 0, limit: 10, overrideAccess: true, where: { subject: { equals: 'Upload drawer probe' } } })
for (const c of campaigns.docs) {
  await payload.delete({ collection: 'newsletter-campaigns', id: c.id, overrideAccess: true })
  console.log(`campaign #${c.id} deleted`)
}

const users = await payload.find({ collection: 'users', limit: 5, overrideAccess: true, where: { email: { equals: 'upload-probe@example.invalid' } } })
for (const u of users.docs) {
  await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  console.log(`probe user #${u.id} deleted`)
}

const left = await payload.count({ collection: 'media', overrideAccess: true, where: { alt: { in: PROBE_ALTS } } })
console.log(`probe media remaining: ${left.totalDocs}`)
process.exit(0)
