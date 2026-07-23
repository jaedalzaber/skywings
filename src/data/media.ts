import type { Media } from '@/payload-types'

export type MediaImage = {
  alt: string
  height?: number | null
  url: string
  width?: number | null
}

export type MediaFile = {
  alt: string
  mimeType?: string | null
  scale?: number | null
  url: string
}

const imageExtensionPattern = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i
const videoExtensionPattern = /\.(m4v|mov|mp4|ogv|ogg|webm)(?:[?#]|$)/i

function mediaUrl(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const media = value as Media

  return media.url || null
}

export function isMediaImage(value: unknown): boolean {
  const url = mediaUrl(value)

  if (!url || !value || typeof value !== 'object') {
    return false
  }

  const media = value as Media
  const mimeType = media.mimeType?.toLowerCase()

  if (mimeType?.startsWith('image/')) {
    return true
  }

  if (mimeType?.startsWith('video/')) {
    return false
  }

  return imageExtensionPattern.test(url)
}

export function isMediaVideo(value: unknown): boolean {
  const url = mediaUrl(value)

  if (!url || !value || typeof value !== 'object') {
    return false
  }

  const media = value as Media
  const mimeType = media.mimeType?.toLowerCase()

  if (mimeType?.startsWith('video/')) {
    return true
  }

  if (mimeType?.startsWith('image/')) {
    return false
  }

  return videoExtensionPattern.test(url)
}

export function getMediaImage(value: unknown): MediaImage | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const media = value as Media

  if (!media.url || !isMediaImage(value)) {
    return null
  }

  return {
    alt: media.alt || media.filename || 'Sky Wings media',
    height: media.height,
    url: media.url,
    width: media.width,
  }
}

export function getMediaFile(value: unknown): MediaFile | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const media = value as Media & { scale?: number | null; title?: string | null }

  if (!media.url) {
    return null
  }

  return {
    alt: media.alt || media.title || media.filename || 'Sky Wings media',
    mimeType: media.mimeType,
    scale: typeof media.scale === 'number' ? media.scale : null,
    url: media.url,
  }
}
