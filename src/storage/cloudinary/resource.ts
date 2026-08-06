/**
 * Pure helpers shared by the Cloudinary adapter, the migration script and the
 * tests. Keeping them free of the Cloudinary SDK makes the routing rules --
 * which decide where every upload physically lands -- cheap to assert.
 */

export type CloudinaryResourceType = 'image' | 'raw' | 'video'

const imageExtensionPattern = /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i
const videoExtensionPattern = /\.(m4v|mov|mp4|ogv|webm)$/i

/**
 * Cloudinary's free plan caps a single asset well below the size of an
 * uncompressed GLB. Uploads over the cap are rejected by the API with a terse
 * message, so the adapter checks these first and fails with a useful one.
 *
 * @see https://cloudinary.com/pricing -- verify against your own plan before
 * raising these; paid plans lift them substantially.
 */
export const freePlanMaxBytes: Record<CloudinaryResourceType, number> = {
  image: 10 * 1024 * 1024,
  raw: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
}

/**
 * Cloudinary splits its API by resource type, and the wrong one silently
 * changes both the delivery URL and which transformations are legal. SVG is
 * deliberately an `image` (Cloudinary rasterises it on demand); PDFs and 3D
 * models are `raw` because Cloudinary cannot transform them and `image`
 * delivery of PDFs is blocked by default on new accounts.
 *
 * The extension wins over the mime type on purpose. Upload knows the mime
 * type but delete, URL generation and the static handler only ever receive a
 * filename -- deriving from the extension everywhere keeps all four
 * operations pointing at the same Cloudinary object.
 */
export function resolveResourceType(args: {
  filename: string
  mimeType?: null | string
}): CloudinaryResourceType {
  if (imageExtensionPattern.test(args.filename)) return 'image'
  if (videoExtensionPattern.test(args.filename)) return 'video'
  if (/\.[^./\\]+$/.test(args.filename)) return 'raw'

  // Extensionless upload: the mime type is all we have to go on.
  const mimeType = args.mimeType?.toLowerCase().trim()

  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'

  return 'raw'
}

/**
 * `raw` public IDs must carry the file extension -- Cloudinary treats the
 * public ID as the whole object key. For `image` and `video` the extension is
 * the delivery format instead, and leaving it on produces `foo.png.png`.
 */
export function resolvePublicId(args: {
  filename: string
  folder: string
  resourceType: CloudinaryResourceType
}): string {
  const { filename, folder, resourceType } = args
  const base =
    resourceType === 'raw' ? filename : filename.replace(/\.[^./\\]+$/, '')
  const prefix = folder.replace(/^\/+|\/+$/g, '')

  return prefix ? `${prefix}/${base}` : base
}

/**
 * Folder layout inside the Cloudinary account: `<rootFolder>/<collection>`.
 * Keeping collections separated means a stray `media` filename can never
 * collide with a brochure of the same name.
 */
export function resolveFolder(args: {
  collectionSlug: string
  prefix?: string
  rootFolder?: string
}): string {
  return [args.rootFolder, args.collectionSlug, args.prefix]
    .map((segment) => segment?.replace(/^\/+|\/+$/g, ''))
    .filter((segment): segment is string => Boolean(segment))
    .join('/')
}

export class CloudinaryFileTooLargeError extends Error {
  constructor(args: {
    filename: string
    filesize: number
    maxBytes: number
    resourceType: CloudinaryResourceType
  }) {
    const toMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

    super(
      `"${args.filename}" is ${toMb(args.filesize)}, over the ${toMb(args.maxBytes)} ` +
        `limit for Cloudinary "${args.resourceType}" uploads on this plan. ` +
        (args.resourceType === 'raw'
          ? 'Compress it (for GLB files: pnpm run compress:glb) or raise maxBytes if you are on a paid plan.'
          : 'Compress it or raise maxBytes if you are on a paid plan.'),
    )
    this.name = 'CloudinaryFileTooLargeError'
  }
}

export function assertWithinPlanLimit(args: {
  filename: string
  filesize: number
  maxBytes: Record<CloudinaryResourceType, number>
  resourceType: CloudinaryResourceType
}): void {
  const maxBytes = args.maxBytes[args.resourceType]

  if (args.filesize > maxBytes) {
    throw new CloudinaryFileTooLargeError({
      filename: args.filename,
      filesize: args.filesize,
      maxBytes,
      resourceType: args.resourceType,
    })
  }
}
