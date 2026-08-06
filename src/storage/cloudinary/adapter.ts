import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import { v2 as cloudinary } from 'cloudinary'

import type { CloudinaryResourceType } from './resource'
import {
  assertWithinPlanLimit,
  freePlanMaxBytes,
  resolveFolder,
  resolvePublicId,
  resolveResourceType,
} from './resource'

export type CloudinaryAdapterArgs = {
  apiKey: string
  apiSecret: string
  cloudName: string
  /** Per-resource-type upload ceiling. Defaults to Cloudinary's free plan. */
  maxBytes?: Partial<Record<CloudinaryResourceType, number>>
  /** Top-level Cloudinary folder every collection is nested under. */
  rootFolder?: string
}

/**
 * Cloudinary keeps its credentials in module-level state, so configure once
 * rather than per request.
 */
let configured = false

function configureCloudinary(args: CloudinaryAdapterArgs) {
  if (configured) return

  cloudinary.config({
    api_key: args.apiKey,
    api_secret: args.apiSecret,
    cloud_name: args.cloudName,
    secure: true,
  })
  configured = true
}

function uploadBuffer(args: {
  buffer: Buffer
  publicId: string
  resourceType: CloudinaryResourceType
}): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        // `public_id` already carries the folder, so passing `folder` too
        // would nest it twice.
        invalidate: true,
        overwrite: true,
        public_id: args.publicId,
        resource_type: args.resourceType,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Cloudinary upload returned no result.'))

        resolve({ public_id: result.public_id, secure_url: result.secure_url })
      },
    )

    stream.end(args.buffer)
  })
}

export function cloudinaryAdapter(args: CloudinaryAdapterArgs): Adapter {
  const maxBytes = { ...freePlanMaxBytes, ...args.maxBytes }

  return ({ collection, prefix }): GeneratedAdapter => {
    const folderFor = (docPrefix?: string) =>
      resolveFolder({
        collectionSlug: collection.slug,
        prefix: docPrefix ?? prefix,
        rootFolder: args.rootFolder,
      })

    /**
     * Every operation other than upload receives only a filename, so this is
     * the single place that turns one back into a Cloudinary object.
     */
    const locate = (filename: string, docPrefix?: string) => {
      const resourceType = resolveResourceType({ filename })

      return {
        publicId: resolvePublicId({
          filename,
          folder: folderFor(docPrefix),
          resourceType,
        }),
        resourceType,
      }
    }

    return {
      name: 'cloudinary',

      generateURL: ({ data, filename, prefix: docPrefix }) => {
        const { publicId, resourceType } = locate(filename, docPrefix)
        // `image`/`video` public IDs have no extension, so the delivery format
        // has to be restored here or Cloudinary serves its default.
        const format = resourceType === 'raw' ? undefined : filename.split('.').pop()

        return cloudinary.url(publicId, {
          format,
          resource_type: resourceType,
          secure: true,
          type: 'upload',
          version: typeof data?.cloudinaryVersion === 'number' ? data.cloudinaryVersion : undefined,
        })
      },

      handleDelete: async ({ doc, filename }) => {
        const { publicId, resourceType } = locate(filename, (doc as { prefix?: string })?.prefix)

        await cloudinary.uploader.destroy(publicId, {
          invalidate: true,
          resource_type: resourceType,
        })
      },

      handleUpload: async ({ data, file }) => {
        const resourceType = resolveResourceType({
          filename: file.filename,
          mimeType: file.mimeType,
        })

        // Cloudinary rejects oversized uploads with an opaque error; fail here
        // instead so the admin UI names the file and the limit.
        assertWithinPlanLimit({
          filename: file.filename,
          filesize: file.filesize,
          maxBytes,
          resourceType,
        })

        await uploadBuffer({
          buffer: file.buffer,
          publicId: resolvePublicId({
            filename: file.filename,
            folder: folderFor(data?.prefix),
            resourceType,
          }),
          resourceType,
        })

        return data
      },

      staticHandler: async (req, { headers, params: { filename, prefix: docPrefix } }) => {
        const { publicId, resourceType } = locate(filename, docPrefix)
        const format = resourceType === 'raw' ? undefined : filename.split('.').pop()
        const url = cloudinary.url(publicId, {
          format,
          resource_type: resourceType,
          secure: true,
          type: 'upload',
        })

        try {
          const range = req.headers.get('range')
          const upstream = await fetch(url, range ? { headers: { range } } : undefined)

          if (!upstream.ok || !upstream.body) {
            // Surface the real upstream status. The Vercel Blob adapter this
            // replaced collapsed every failure into an empty 204, which is
            // what made the original outage so hard to read.
            req.payload.logger.error(
              `Cloudinary returned ${upstream.status} for ${publicId} (${resourceType}).`,
            )

            return new Response(null, {
              status: upstream.status === 404 ? 404 : 502,
              statusText: upstream.status === 404 ? 'Not Found' : 'Bad Gateway',
            })
          }

          const responseHeaders = new Headers(headers)
          for (const header of [
            'accept-ranges',
            'content-length',
            'content-range',
            'content-type',
            'etag',
            'last-modified',
          ]) {
            const value = upstream.headers.get(header)
            if (value) responseHeaders.set(header, value)
          }
          responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')

          return new Response(upstream.body, {
            headers: responseHeaders,
            status: upstream.status,
          })
        } catch (err) {
          req.payload.logger.error({ err, msg: `Cloudinary fetch failed for ${publicId}.` })

          return new Response(null, { status: 502, statusText: 'Bad Gateway' })
        }
      },
    }
  }
}

export { configureCloudinary }
