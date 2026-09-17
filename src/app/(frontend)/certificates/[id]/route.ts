import type { NextRequest } from 'next/server'

import { getPayloadClient } from '@/data/payload'
import { fetchCloudinaryFile } from '@/storage/cloudinary/fetchFile'
import { resolveFolder, resolvePublicId, resolveResourceType } from '@/storage/cloudinary/resource'

/**
 * Opens a certificate PDF from the Media library in the browser.
 *
 * Media links normally go straight to Cloudinary, but Cloudinary blocks PDF
 * delivery by default and answers "deny or ACL failure". This route fetches
 * the file through the signed download API instead and hands it over inline,
 * so it opens in the tab rather than downloading.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^\d+$/.test(id)) return new Response('Not found', { status: 404 })

  const payload = await getPayloadClient()
  const doc = await payload
    .findByID({ collection: 'media', depth: 0, disableErrors: true, id: Number(id) })
    .catch(() => null)

  // Only PDFs: this is not a general way to fetch any media file.
  if (!doc?.filename || doc.mimeType !== 'application/pdf') {
    return new Response('Not found', { status: 404 })
  }

  const resourceType = resolveResourceType({ filename: doc.filename, mimeType: doc.mimeType })
  const publicId = resolvePublicId({
    filename: doc.filename,
    // Must match rootFolder in payload.config.ts.
    folder: resolveFolder({ collectionSlug: 'media', rootFolder: 'skywings' }),
    resourceType,
  })

  const upstream = await fetchCloudinaryFile({
    format: resourceType === 'raw' ? undefined : 'pdf',
    publicId,
    resourceType,
  }).catch(() => null)

  if (!upstream?.ok || !upstream.body) {
    payload.logger.error(`Certificate ${id}: Cloudinary returned ${upstream?.status ?? 'no response'} for ${publicId}.`)
    return new Response('Certificate unavailable', { status: 502 })
  }

  const safeName = doc.filename.replace(/["\\\r\n]/g, '')

  return new Response(upstream.body, {
    headers: {
      // An hour in the browser, a day at the edge: a replaced PDF shows up soon.
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Content-Type': 'application/pdf',
      ...(upstream.headers.get('content-length')
        ? { 'Content-Length': upstream.headers.get('content-length')! }
        : {}),
    },
  })
}
