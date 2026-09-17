import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })
const mode = process.env.MODE
const email = 'upload-probe@example.invalid'
if (mode === 'create') {
  const existing = await payload.find({ collection: 'users', limit: 1, overrideAccess: true, where: { email: { equals: email } } })
  if (!existing.docs[0]) await payload.create({ collection: 'users', data: { email, password: 'Probe-Only-9d2f41' } as never, overrideAccess: true })
  console.log('probe user ready')
} else {
  const users = await payload.find({ collection: 'users', limit: 5, overrideAccess: true, where: { email: { equals: email } } })
  for (const u of users.docs) await payload.delete({ collection: 'users', id: u.id, overrideAccess: true })
  const media = await payload.find({ collection: 'media', limit: 20, overrideAccess: true, where: { filename: { like: 'http-probe' } } })
  for (const m of media.docs) await payload.delete({ collection: 'media', id: m.id, overrideAccess: true })
  console.log(`cleaned: ${users.docs.length} user(s), ${media.docs.length} probe media`)
}
process.exit(0)
