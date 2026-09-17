/**
 * Moves footer sign-ups saved before the newsletter list existed -- Form
 * Submissions named "Footer newsletter" -- into Newsletter -> Subscribers.
 *
 * They are imported as Active with every topic, because each one asked to be
 * subscribed; source "site-footer (imported)" marks them. An address already
 * on the list is left exactly as it is. The Form Submissions are not deleted.
 *
 * Idempotent: re-running skips everyone already imported.
 *
 *   pnpm run newsletter:import            (DRY_RUN=1 to preview)
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { ALL_TOPICS, newToken } from '../src/lib/newsletter/config'

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'form-submissions',
  depth: 0,
  overrideAccess: true,
  pagination: false,
  sort: 'createdAt',
  where: { formName: { equals: 'Footer newsletter' } },
})

let imported = 0
let skipped = 0
const seen = new Set<string>()

for (const submission of docs) {
  const email = submission.email?.trim().toLowerCase()
  if (!email || seen.has(email)) continue
  seen.add(email)

  const existing = await payload.count({
    collection: 'subscribers',
    overrideAccess: true,
    where: { email: { equals: email } },
  })
  if (existing.totalDocs > 0) {
    skipped += 1
    console.log(`skip    ${email} (already on the list)`)
    continue
  }

  console.log(`${dryRun ? 'would import' : 'import '} ${email}`)
  if (!dryRun) {
    await payload.create({
      collection: 'subscribers',
      data: {
        confirmedAt: submission.createdAt,
        email,
        source: 'site-footer (imported)',
        status: 'active',
        token: newToken(),
        topics: ALL_TOPICS,
      },
      overrideAccess: true,
    })
  }
  imported += 1
}

console.log(`${dryRun ? 'Dry run: would import' : 'Imported'} ${imported}; skipped ${skipped}.`)
process.exit(0)
