import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { CollectionOptions } from '@payloadcms/plugin-cloud-storage/types'
import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import type { CloudinaryAdapterArgs } from './adapter'
import { cloudinaryAdapter, configureCloudinary } from './adapter'

export type CloudinaryStorageOptions = {
  /**
   * Collections to store in Cloudinary. `disablePayloadAccessControl: true`
   * serves the Cloudinary CDN URL directly instead of proxying bytes through
   * the Next server -- only safe where the collection's read access is public.
   */
  collections: Partial<Record<UploadCollectionSlug, Pick<CollectionOptions, 'disablePayloadAccessControl' | 'prefix'> | true>>
  enabled?: boolean
} & Omit<CloudinaryAdapterArgs, 'apiKey' | 'apiSecret' | 'cloudName'> &
  Partial<Pick<CloudinaryAdapterArgs, 'apiKey' | 'apiSecret' | 'cloudName'>>

const missingCredentialsMessage = [
  'Cloudinary storage is not configured.',
  'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.',
  'Find them in the Cloudinary dashboard under Settings -> API Keys.',
].join(' ')

/**
 * Payload has no first-party Cloudinary adapter, so this wires our own onto
 * the official `@payloadcms/plugin-cloud-storage` extension point.
 *
 * Cloudinary is the only storage, in every environment. Without credentials
 * the app refuses to start rather than falling back to local disk: the
 * database is shared with the live site, so a file saved only on one
 * computer is a broken image for everyone else. That fallback existed for a
 * while, and uploads made through it never reached the live site.
 */
export const cloudinaryStorage =
  (options: CloudinaryStorageOptions): Plugin =>
  (incomingConfig: Config): Config => {
    if (options.enabled === false) {
      return incomingConfig
    }

    const apiKey = options.apiKey ?? process.env.CLOUDINARY_API_KEY
    const apiSecret = options.apiSecret ?? process.env.CLOUDINARY_API_SECRET
    const cloudName = options.cloudName ?? process.env.CLOUDINARY_CLOUD_NAME

    if (!apiKey || !apiSecret || !cloudName) {
      throw new Error(missingCredentialsMessage)
    }

    configureCloudinary({ apiKey, apiSecret, cloudName })

    const adapter = cloudinaryAdapter({
      apiKey,
      apiSecret,
      cloudName,
      localDelivery: options.localDelivery,
      maxBytes: options.maxBytes,
      rootFolder: options.rootFolder,
    })

    const collections = Object.entries(options.collections).reduce<
      Record<string, CollectionOptions>
    >(
      (acc, [slug, collectionOptions]) => ({
        ...acc,
        [slug]: {
          ...(collectionOptions === true ? {} : collectionOptions),
          adapter,
        },
      }),
      {},
    )

    return cloudStoragePlugin({ collections })(incomingConfig)
  }
