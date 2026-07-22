// Content update: point the CMS "products" page at the redesigned catalog
// (single productListing block, no separate hero). Safe to re-run.
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'products' } },
  })

  if (!docs[0]) {
    console.log('No products page found — the frontend default layout will be used.')
    process.exit(0)
  }

  await payload.update({
    collection: 'pages',
    data: {
      layout: [
        {
          blockType: 'productListing',
          eyebrow: 'Products',
          heading: 'Engineered metal products, built to spec.',
          showFilters: true,
        },
      ],
    },
    id: docs[0].id,
    overrideAccess: true,
  })

  console.log('Updated products page layout.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
