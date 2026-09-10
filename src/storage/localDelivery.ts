import { createHash } from 'node:crypto'

import manifest from './local-delivery-manifest.json'

/**
 * What `pnpm run mirror:media` verified the deployment carries: per
 * collection, Media filenames -> their URL under public/, and brochure / 3D
 * asset filenames present in their committed upload folder.
 */
export type LocalDeliveryManifest = {
  publicFiles: { media: Record<string, string> } & Partial<Record<string, Record<string, string>>>
  uploadDirFiles: Partial<Record<string, string[]>>
}

export const localDeliveryManifest: LocalDeliveryManifest = manifest

/**
 * Cloudinary's free plan was nearing its monthly credit quota, so by default
 * files in the manifest are served from the deployment instead. Set
 * MEDIA_DELIVERY=cloudinary to serve everything from the CDN again.
 */
export const serveLocalCopies = process.env.MEDIA_DELIVERY !== 'cloudinary'

/**
 * Media URLs are baked into every cached query result, and `unstable_cache`
 * keys don't see content. This changes whenever those URLs would, so switching
 * modes or re-running the mirror can't leave pages on stale URLs.
 */
export const mediaDeliveryCacheKey = serveLocalCopies
  ? `media-local-${createHash('sha1').update(JSON.stringify(manifest)).digest('hex').slice(0, 10)}`
  : 'media-cdn'
