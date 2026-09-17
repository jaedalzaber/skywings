import { v2 as cloudinary } from 'cloudinary'

import type { CloudinaryResourceType } from './resource'

/**
 * Fetches a stored file's bytes from Cloudinary.
 *
 * Tries the public CDN URL first. Cloudinary accounts block delivery of PDF
 * and ZIP files by default, answering 401 "deny or ACL failure", so on a
 * 401/403 it retries through the signed download API, which the API key
 * authorises whatever that account setting says.
 */
export async function fetchCloudinaryFile(args: {
  format?: string
  publicId: string
  range?: string | null
  resourceType: CloudinaryResourceType
}): Promise<Response> {
  const { format, publicId, range, resourceType } = args
  const init = range ? { headers: { range } } : undefined

  const cdnUrl = cloudinary.url(publicId, {
    format,
    resource_type: resourceType,
    secure: true,
    type: 'upload',
  })
  const cdn = await fetch(cdnUrl, init)
  if (cdn.status !== 401 && cdn.status !== 403) return cdn

  const downloadUrl = cloudinary.utils.private_download_url(publicId, format ?? '', {
    resource_type: resourceType,
    type: 'upload',
  })

  return fetch(downloadUrl, init)
}
