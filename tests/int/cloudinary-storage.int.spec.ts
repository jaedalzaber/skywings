import { describe, expect, test } from 'vitest'

import {
  assertWithinPlanLimit,
  CloudinaryFileTooLargeError,
  freePlanMaxBytes,
  resolveFolder,
  resolvePublicId,
  resolveResourceType,
} from '@/storage/cloudinary/resource'

describe('Cloudinary resource routing', () => {
  test('routes images, video and everything else to the right Cloudinary API', () => {
    expect(resolveResourceType({ filename: 'hero.png', mimeType: 'image/png' })).toBe('image')
    expect(resolveResourceType({ filename: 'logo.svg', mimeType: 'image/svg+xml' })).toBe('image')
    expect(resolveResourceType({ filename: 'cover.mp4', mimeType: 'video/mp4' })).toBe('video')
    expect(resolveResourceType({ filename: 'arm-1.glb', mimeType: 'model/gltf-binary' })).toBe('raw')
  })

  test('treats PDFs as raw so Cloudinary PDF delivery restrictions do not apply', () => {
    expect(resolveResourceType({ filename: 'catalogue.pdf', mimeType: 'application/pdf' })).toBe(
      'raw',
    )
  })

  test('falls back to the extension when no mime type is supplied', () => {
    expect(resolveResourceType({ filename: 'hero.png', mimeType: null })).toBe('image')
    expect(resolveResourceType({ filename: 'cover.mp4' })).toBe('video')
    expect(resolveResourceType({ filename: 'model.glb' })).toBe('raw')
  })

  test('lets the extension win so upload and delete resolve the same object', () => {
    // Delete and the static handler only ever see a filename. If the mime type
    // could override it, an upload stored as `raw` would be looked up as
    // `image` later and 404.
    expect(resolveResourceType({ filename: 'drawing.pdf', mimeType: 'image/png' })).toBe('raw')
    expect(resolveResourceType({ filename: 'photo.png', mimeType: 'application/octet-stream' })).toBe(
      'image',
    )
  })

  test('uses the mime type only for extensionless uploads', () => {
    expect(resolveResourceType({ filename: 'screenshot', mimeType: 'image/png' })).toBe('image')
    expect(resolveResourceType({ filename: 'clip', mimeType: 'video/mp4' })).toBe('video')
    expect(resolveResourceType({ filename: 'blob' })).toBe('raw')
  })

  test('keeps the extension on raw public IDs and strips it elsewhere', () => {
    expect(
      resolvePublicId({ filename: 'arm-1.glb', folder: 'skywings/three-d-assets', resourceType: 'raw' }),
    ).toBe('skywings/three-d-assets/arm-1.glb')

    expect(resolvePublicId({ filename: 'hero.png', folder: 'skywings/media', resourceType: 'image' })).toBe(
      'skywings/media/hero',
    )

    expect(resolvePublicId({ filename: 'cover.mp4', folder: 'skywings/media', resourceType: 'video' })).toBe(
      'skywings/media/cover',
    )
  })

  test('only strips the final extension from dotted filenames', () => {
    expect(
      resolvePublicId({ filename: 'folding_stand_1-1.png', folder: '', resourceType: 'image' }),
    ).toBe('folding_stand_1-1')
  })

  test('namespaces every collection under the root folder', () => {
    expect(resolveFolder({ collectionSlug: 'media', rootFolder: 'skywings' })).toBe('skywings/media')
    expect(resolveFolder({ collectionSlug: 'brochures' })).toBe('brochures')
    expect(
      resolveFolder({ collectionSlug: 'media', prefix: 'nested', rootFolder: '/skywings/' }),
    ).toBe('skywings/media/nested')
  })

  test('rejects oversized uploads before they reach Cloudinary', () => {
    expect(() =>
      assertWithinPlanLimit({
        filename: 'Folding Stand.glb',
        filesize: 36_240_852,
        maxBytes: freePlanMaxBytes,
        resourceType: 'raw',
      }),
    ).toThrow(CloudinaryFileTooLargeError)
  })

  test('names the offending file and the limit so the failure is actionable', () => {
    expect(() =>
      assertWithinPlanLimit({
        filename: 'Folding Stand.glb',
        filesize: 36_240_852,
        maxBytes: freePlanMaxBytes,
        resourceType: 'raw',
      }),
    ).toThrow(/"Folding Stand\.glb" is 34\.6 MB, over the 10\.0 MB limit/)
  })

  test('allows files inside the plan limit', () => {
    expect(() =>
      assertWithinPlanLimit({
        filename: 'arm-1.glb',
        filesize: 869_292,
        maxBytes: freePlanMaxBytes,
        resourceType: 'raw',
      }),
    ).not.toThrow()
  })
})
