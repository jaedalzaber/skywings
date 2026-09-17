import config from '@payload-config'
import { getPayload } from 'payload'
const payload = await getPayload({ config })
for (const draft of [false, true]) {
  const { docs } = await payload.find({ collection: 'industry-pages', depth: 0, draft, limit: 1, overrideAccess: true, where: { slug: { equals: 'construction-and-infrastructure' } } })
  const value = ((docs[0] as { layout: Record<string, unknown>[] }).layout).find((b) => b.blockType === 'industryValue')
  console.log(`draft=${draft} featureImage=`, JSON.stringify(value?.featureImage), typeof value?.featureImage, '| updatedAt', (docs[0] as { updatedAt: string }).updatedAt, '| status', (docs[0] as { _status: string })._status)
}
process.exit(0)
