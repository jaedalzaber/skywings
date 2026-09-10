/**
 * Clears Next's data cache.
 *
 * The seed scripts run through `payload run`, outside a Next request context,
 * so the `revalidateTag` calls in the collection hooks cannot fire -- they
 * throw "static generation store missing" and are swallowed. Anything the
 * seeds change therefore stays invisible behind `unstable_cache`, which has no
 * TTL and survives a dev-server restart because it is written to disk.
 *
 * Next 16 moved that directory: dev writes to .next/dev/cache/fetch-cache and
 * builds to .next/cache/fetch-cache. This script targeted only the old path,
 * so it printed "No .next/cache to clear" and did nothing while the dev server
 * kept serving a stale Products menu. It now clears every location, and says
 * which ones it found so a silent miss is visible.
 *
 * Run this after any seed, then restart the dev server -- the running process
 * also holds the same entries in memory:
 *
 *   pnpm run seed:product-taxonomy
 *   pnpm run refresh:cache
 *   pnpm run dev
 */
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(process.cwd(), '.next')

// The data cache only; the sibling turbopack/ directory is compiler output and
// re-clearing it on every seed would cost a full rebuild for nothing.
const targets = [
  path.join(root, 'cache', 'fetch-cache'),
  path.join(root, 'dev', 'cache', 'fetch-cache'),
  path.join(root, 'build', 'cache', 'fetch-cache'),
]

const cleared = targets.filter((target) => {
  if (!existsSync(target)) return false

  rmSync(target, { force: true, recursive: true })
  return true
})

if (cleared.length === 0) {
  console.log('No Next data cache found. Checked:')
  for (const target of targets) console.log(`  ${path.relative(process.cwd(), target)}`)
} else {
  for (const target of cleared) {
    console.log(`Cleared ${path.relative(process.cwd(), target)}`)
  }
  console.log('Restart the dev server to pick up seeded data.')
}
