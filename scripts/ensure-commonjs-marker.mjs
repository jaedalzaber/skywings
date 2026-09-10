/**
 * Runs after `next build`: adds .next/package.json to every route's trace.
 *
 * package.json declares "type": "module", so Node reads any .js file under it
 * as an ES module. Next's compiled server output is CommonJS, and Next writes
 * .next/package.json ({"type": "commonjs"}) so Node reads it that way -- but
 * Turbopack's per-route traces (.nft.json) list the project's root
 * package.json and not that one. Vercel builds each function from those
 * traces, so its functions carried "type": "module" with no marker beneath
 * it, and every server-rendered route failed on the first request:
 *
 *   Error: require() of ES Module /var/task/.next/server/app/(frontend)/page.js
 *   from /var/task/___next_launcher.cjs not supported.   (ERR_REQUIRE_ESM)
 *
 * Prerendered pages still loaded, since no function runs for them.
 * `outputFileTracingIncludes` cannot fix this: Next skips its include step
 * for Turbopack builds. Listing the marker in each trace puts it in each
 * function, beside the pages it describes.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const distDir = path.resolve(process.cwd(), '.next')
const marker = path.join(distDir, 'package.json')
const serverDir = path.join(distDir, 'server')

if (!existsSync(marker)) {
  console.error('[commonjs-marker] .next/package.json is missing -- did `next build` run?')
  process.exit(1)
}

const markerType = JSON.parse(readFileSync(marker, 'utf8')).type
if (markerType !== 'commonjs') {
  console.error(`[commonjs-marker] .next/package.json has type "${markerType}", expected "commonjs".`)
  process.exit(1)
}

const traces = readdirSync(serverDir, { recursive: true })
  .filter((file) => String(file).endsWith('.nft.json'))
  .map((file) => path.join(serverDir, String(file)))

let patched = 0

for (const trace of traces) {
  const data = JSON.parse(readFileSync(trace, 'utf8'))
  // Trace entries are relative to the trace file's folder, with forward slashes.
  const entry = path.relative(path.dirname(trace), marker).split(path.sep).join('/')

  if (!Array.isArray(data.files) || data.files.includes(entry)) continue

  data.files.push(entry)
  writeFileSync(trace, JSON.stringify(data))
  patched += 1
}

console.log(`[commonjs-marker] .next/package.json added to ${patched} of ${traces.length} route traces.`)
