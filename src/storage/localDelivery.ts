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
 * Every file is served from Cloudinary. The copies committed under public/
 * (and the brochure / 3D asset upload folders) are only used when
 * MEDIA_DELIVERY=local is set explicitly -- a fallback for saving CDN credits,
 * not the normal path.
 *
 * It used to be the default, and that hid a real problem: a page looked right
 * wherever a local copy existed, so files that had never reached Cloudinary
 * went unnoticed until they 404'd on the live site.
 */
export const serveLocalCopies = process.env.MEDIA_DELIVERY === 'local'

/**
 * Media URLs are baked into every cached query result, and `unstable_cache`
 * keys don't see content. This changes whenever those URLs would, so switching
 * modes or re-running the mirror can't leave pages on stale URLs.
 */
export const mediaDeliveryCacheKey = serveLocalCopies
  ? `media-local-${createHash('sha1').update(JSON.stringify(manifest)).digest('hex').slice(0, 10)}`
  : 'media-cdn'
