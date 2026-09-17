import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const { docs: families } = await payload.find({ collection: 'product-families', depth: 0, limit: 100, overrideAccess: true, pagination: false, sort: 'title' })
console.log('FAMILIES (id | title | industryFocus count)')
for (const f of families as Record<string, unknown>[]) {
  console.log(`  ${f.id}\t${f.title}\t${(f.industryFocus as unknown[] | null)?.length ?? 0}`)
}

const { docs: products } = await payload.find({ collection: 'products', depth: 1, limit: 300, overrideAccess: true, pagination: false, sort: 'title' })
console.log(`\nPRODUCTS: ${products.length}`)
const byFamily = new Map<string, string[]>()
for (const p of products as Record<string, unknown>[]) {
  const fam = (p.productFamily as { title?: string } | null)?.title ?? '(none)'
  const list = byFamily.get(fam) ?? []
  list.push(`${p.id}:${p.title}`)
  byFamily.set(fam, list)
}
for (const [fam, list] of [...byFamily.entries()].sort()) {
  console.log(`\n${fam} (${list.length})`)
  console.log('   ' + list.join(' | '))
}
process.exit(0)
