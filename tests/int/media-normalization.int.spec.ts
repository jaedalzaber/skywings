import { describe, expect, test } from 'vitest'

import { resolveHomeHeroCoverMedia } from '@/data/home'
import { getMediaImage, isMediaImage, isMediaVideo } from '@/data/media'

describe('media normalization', () => {
  test('does not treat video uploads as images', () => {
    const videoMedia = {
      alt: 'Mobile hero video',
      filename: 'mobile-hero.mp4',
      mimeType: 'video/mp4',
      url: '/api/media/file/mobile-hero.mp4',
    }

    expect(isMediaVideo(videoMedia)).toBe(true)
    expect(isMediaImage(videoMedia)).toBe(false)
    expect(getMediaImage(videoMedia)).toBeNull()
  })

  test('promotes a hero cover video uploaded into the image slot', () => {
    const misplacedVideo = {
      alt: 'Mobile hero video',
      filename: 'mobile-hero.mp4',
      mimeType: 'video/mp4',
      url: '/api/media/file/mobile-hero.mp4',
    }

    expect(resolveHomeHeroCoverMedia('image', misplacedVideo, null)).toEqual({
      image: null,
      type: 'video',
      video: {
        alt: 'Mobile hero video',
        mimeType: 'video/mp4',
        scale: null,
        url: '/api/media/file/mobile-hero.mp4',
      },
    })
  })
})
