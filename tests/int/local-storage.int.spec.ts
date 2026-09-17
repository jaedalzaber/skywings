// @vitest-environment node
import { existsSync } from 'node:fs'
import path from 'node:path'

import type { CollectionConfig, PayloadRequest } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { localDeliveryManifest } from '@/storage/localDelivery'
import { localStorageAdapter } from '@/storage/localStorage'

type LocalDelivery = NonNullable<Parameters<typeof localStorageAdapter>[0]>['localDelivery']

function adapterFor(slug: string, localDelivery?: LocalDelivery) {
  return localStorageAdapter({ localDelivery })({
    collection: { slug } as CollectionConfig,
    prefix: undefined,
  })
}

const generateURL = (adapter: ReturnType<typeof adapterFor>, filename: string) =>
  adapter.generateURL!({ collection: {} as never, data: {}, filename, prefix: '' })

const errorLog = vi.fn()
const req = { headers: new Headers(), payload: { logger: { error: errorLog } } } as unknown as PayloadRequest

const mirrored = Object.keys(localDeliveryManifest.publicFiles.media)[0]

describe('local storage adapter (no Cloudinary keys)', () => {
  test('hands out the public/ path for mirrored media, like the Cloudinary adapter', async () => {
    const adapter = adapterFor('media', {
      publicFiles: { media: { 'Frame 366.png': '/media/Frame%20366.png' } },
    })
    expect(await generateURL(adapter, 'Frame 366.png')).toBe('/media/Frame%20366.png')
  })

  test("falls back to Payload's file route for anything not mirrored", async () => {
    const adapter = adapterFor('media', { publicFiles: { media: {} } })
    expect(await generateURL(adapter, 'new upload.png')).toBe('/api/media/file/new%20upload.png')
  })

  test('serves a mirrored file from public/ when the file route is hit anyway', async () => {
    expect(mirrored, 'the manifest lists at least one media file').toBeTruthy()
    const url = localDeliveryManifest.publicFiles.media[mirrored]
    expect(existsSync(path.join(process.cwd(), 'public', ...url.split('/').map(decodeURIComponent)))).toBe(true)

    const response = await adapterFor('media', localDeliveryManifest).staticHandler(req, {
      params: { collection: 'media', filename: mirrored },
    })

    expect(response.status).toBe(200)
    expect(Number(response.headers.get('content-length'))).toBeGreaterThan(0)
    expect(response.headers.get('content-type')).toMatch(/^(image|video)\//)
  })

  test('answers 404 with a pointer to the fix, never a 500, for a file nowhere on disk', async () => {
    const response = await adapterFor('media', { publicFiles: { media: {} } }).staticHandler(req, {
      params: { collection: 'media', filename: 'never-here.png' },
    })

    expect(response.status).toBe(404)
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('mirror:media'))
  })
})
