/**
 * Applies the collection config to the database, then exits.
 *
 * Run with PAYLOAD_DB_PUSH=true: the adapter pushes while Payload
 * initialises, so there is nothing to do here but let that happen and report.
 * Additive changes only -- drizzle asks an interactive rename question when a
 * column is dropped and added in the same pass, which hangs a script.
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'products',
  depth: 0,
  limit: 1,
  select: { cardHoverImage: true, title: true },
})

console.log(`push complete; sample product: ${JSON.stringify(docs[0] ?? null)}`)

process.exit(0)
