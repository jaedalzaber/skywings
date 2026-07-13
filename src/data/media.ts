import type { Media } from '@/payload-types'

export type MediaImage = {
  alt: string
  height?: number | null
  url: string
  width?: number | null
}

export function getMediaImage(value: unknown): MediaImage | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const media = value as Media

  if (!media.url) {
    return null
  }

  return {
    alt: media.alt || media.filename || 'Sky Wings media',
    height: media.height,
    url: media.url,
    width: media.width,
  }
}
