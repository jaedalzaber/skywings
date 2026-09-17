import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'

import type { CloudinaryAdapterArgs } from './cloudinary/adapter'

export type LocalStorageAdapterArgs = {
  /** The same manifest the Cloudinary adapter serves local copies from. */
  localDelivery?: CloudinaryAdapterArgs['localDelivery']
}

const contentTypes: Record<string, string> = {
  gif: 'image/gif',
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  webm: 'video/webm',
  webp: 'image/webp',
}

function contentTypeFor(filename: string) {
  return contentTypes[filename.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream'
}

/*
 * Every file-system call below builds its own path, with the turbopackIgnore
 * marker on process.cwd() inside that very call. It must not move into a
 * helper: a path passed through a function reached Turbopack without the
 * marker, it traced the whole project into every route -- package.json
 * included -- and every server-rendered page on Vercel failed with
 * ERR_REQUIRE_ESM. See readUploadDirFile in the Cloudinary adapter.
 */

/**
 * Storage for a machine without Cloudinary credentials.
 *
 * The Cloudinary adapter only exists when the keys are set, and Payload's own
 * disk storage knows nothing about the mirrored copies under public/. So on a
 * checkout with no keys every mirrored image 500'd: the URL pointed at
 * /api/media/file/<name>, and the handler looked for it in ./media, which is
 * gitignored and empty on a fresh clone.
 *
 * This adapter hands out the same public/ URLs the Cloudinary adapter does for
 * anything in the manifest, and reads the upload folder for the rest -- the
 * folder Payload's default storage would have used, so uploads made here land
 * in the same place. Nothing is ever fetched from Cloudinary.
 */
export function localStorageAdapter(args: LocalStorageAdapterArgs = {}): Adapter {
  return ({ collection }): GeneratedAdapter => {
    const slug = collection.slug
    const publicFiles = args.localDelivery?.publicFiles?.[slug]

    /** The upload folder first, then the mirrored copy under public/. */
    const readLocal = async (filename: string) => {
      const base = path.basename(filename)
      const fromUploadDir = await readFile(
        path.join(/* turbopackIgnore: true */ process.cwd(), slug, base),
      ).catch(() => null)
      if (fromUploadDir) return fromUploadDir

      const publicUrl = publicFiles?.[base]
      if (!publicUrl) return null
      return readFile(
        path.join(
          /* turbopackIgnore: true */ process.cwd(),
          'public',
          ...publicUrl.split('/').filter(Boolean).map(decodeURIComponent),
        ),
      ).catch(() => null)
    }

    return {
      name: 'local',
      generateURL: ({ filename, prefix }) => {
        const publicFile = !prefix && publicFiles?.[filename]
        if (publicFile) return publicFile
        return `/api/${slug}/file/${encodeURIComponent(filename)}`
      },
      handleDelete: async ({ filename }) => {
        try {
          await unlink(
            path.join(/* turbopackIgnore: true */ process.cwd(), slug, path.basename(filename)),
          )
        } catch {
          // Already gone, or never written here: nothing to remove.
        }
      },
      handleUpload: async ({ data, file }) => {
        await mkdir(path.join(/* turbopackIgnore: true */ process.cwd(), slug), { recursive: true })
        await writeFile(
          path.join(/* turbopackIgnore: true */ process.cwd(), slug, path.basename(file.filename)),
          file.buffer,
        )
        return data
      },
      staticHandler: async (req, { headers, params: { filename } }) => {
        const local = await readLocal(filename)
        if (!local) {
          req.payload.logger.error(
            `File ${filename} for collection ${slug} is not on this machine: not in ./${slug} and not mirrored under public/. ` +
              'Run `pnpm run mirror:media` with Cloudinary keys set, or copy the file into that folder.',
          )
          return new Response(null, { status: 404, statusText: 'Not Found' })
        }

        const responseHeaders = new Headers(headers)
        responseHeaders.set('content-type', contentTypeFor(filename))
        responseHeaders.set('content-length', String(local.byteLength))
        responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
        return new Response(new Uint8Array(local), { headers: responseHeaders })
      },
    }
  }
}
