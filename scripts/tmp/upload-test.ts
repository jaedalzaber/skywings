import { readFileSync } from 'node:fs'
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const data = readFileSync('public/media/s4.png')
try {
  const doc = await payload.create({
    collection: 'media',
    data: { alt: 'upload probe' },
    file: { data, mimetype: 'image/png', name: `upload-probe-${Date.now()}.png`, size: data.length },
    overrideAccess: true,
  })
  console.log('CREATE OK', JSON.stringify({ filename: doc.filename, id: doc.id, url: doc.url }))
  await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  console.log('probe deleted')
} catch (error) {
  console.log('CREATE FAILED:', error instanceof Error ? `${error.name}: ${error.message}` : error)
  console.log((error as Error).stack?.split('\n').slice(0, 12).join('\n'))
}
process.exit(0)
