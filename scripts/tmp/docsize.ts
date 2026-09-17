import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })
for (const slug of ['aviation-ground-support-equipment', 'construction-and-infrastructure', 'sheet-metal-fabrication']) {
  const { docs } = await payload.find({ collection: 'industry-pages', depth: 0, draft: true, limit: 1, overrideAccess: true, where: { slug: { equals: slug } } })
  const deep = await payload.find({ collection: 'industry-pages', depth: 2, draft: true, limit: 1, overrideAccess: true, where: { slug: { equals: slug } } })
  console.log(`${slug}: depth0 ${Math.round(JSON.stringify(docs[0]).length / 1024)}KB, depth2 ${Math.round(JSON.stringify(deep.docs[0]).length / 1024)}KB`)
}
process.exit(0)
