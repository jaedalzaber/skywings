/**
 * Compresses GLB files in three-d-assets/ so they fit Cloudinary's 10 MB raw
 * upload limit (and, more importantly, so the browser is not asked to pull
 * tens of megabytes to render a hero model).
 *
 * Uses @gltf-transform/cli, already a devDependency. Draco compresses mesh
 * geometry losslessly in practice for this kind of CAD-derived model; WebP
 * texture re-encoding handles the rest.
 *
 *   pnpm run compress:glb            # writes *.compressed.glb alongside originals
 *   pnpm run compress:glb -- --replace   # overwrites the originals in place
 */
import { existsSync } from 'node:fs'
import { readdir, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { execFile as execFileCallback } from 'node:child_process'

const execFile = promisify(execFileCallback)

// Run the CLI's JS entry under the current Node binary. Going through
// `pnpm exec` would need `shell: true` on Windows, which concatenates
// arguments unescaped and breaks on filenames containing spaces. The path is
// hardcoded rather than resolved because the package does not export its
// package.json, so `require.resolve` cannot reach it.
const gltfTransformCli = path.join(
  process.cwd(),
  'node_modules',
  '@gltf-transform',
  'cli',
  'bin',
  'cli.js',
)

const SOURCE_DIR = 'three-d-assets'
const TARGET_BYTES = 10 * 1024 * 1024

const replace = process.argv.includes('--replace')

const toMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(`No ${SOURCE_DIR}/ directory found.`)
    return
  }

  const entries = await readdir(SOURCE_DIR, { withFileTypes: true })
  const models = entries
    .filter((entry) => entry.isFile() && /\.glb$/i.test(entry.name))
    .map((entry) => path.join(SOURCE_DIR, entry.name))

  if (!models.length) {
    console.log(`No .glb files in ${SOURCE_DIR}/.`)
    return
  }

  for (const input of models) {
    const { size: before } = await stat(input)

    if (before <= TARGET_BYTES && !replace) {
      console.log(`${path.basename(input)} — ${toMb(before)}, already under the limit; skipping`)
      continue
    }

    const output = input.replace(/\.glb$/i, '.compressed.glb')
    console.log(`\n${path.basename(input)} — ${toMb(before)}, compressing...`)

    try {
      // `optimize` bundles dedup, prune, Draco geometry compression and
      // texture re-encoding in one pass.
      await execFile(process.execPath, [
        gltfTransformCli,
        'optimize',
        input,
        output,
        '--compress',
        'draco',
        '--texture-compress',
        'webp',
      ])
    } catch (error) {
      console.error(`  failed: ${error.stderr || error.message}`)
      process.exitCode = 1
      continue
    }

    const { size: after } = await stat(output)
    const saved = (((before - after) / before) * 100).toFixed(0)
    console.log(`  ${toMb(before)} -> ${toMb(after)} (${saved}% smaller)`)

    if (after > TARGET_BYTES) {
      console.log(`  STILL over the ${toMb(TARGET_BYTES)} limit — consider decimating the mesh.`)
      process.exitCode = 1
    }

    if (replace) {
      await unlink(input)
      await rename(output, input)
      console.log(`  replaced ${path.basename(input)}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
