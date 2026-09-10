// @vitest-environment node
import { existsSync } from 'node:fs'
import path from 'node:path'

import type { CollectionConfig, PayloadRequest } from 'payload'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { cloudinaryAdapter, configureCloudinary } from '@/storage/cloudinary/adapter'
import { localDeliveryManifest } from '@/storage/localDelivery'

const credentials = { apiKey: 'key', apiSecret: 'secret', cloudName: 'demo' }
configureCloudinary(credentials)

function adapterFor(slug: string, localDelivery?: Parameters<typeof cloudinaryAdapter>[0]['localDelivery']) {
  return cloudinaryAdapter({ ...credentials, localDelivery, rootFolder: 'skywings' })({
    collection: { slug } as CollectionConfig,
    prefix: undefined,
  })
}

const generateURL = (adapter: ReturnType<typeof adapterFor>, filename: string) =>
  adapter.generateURL!({ collection: {} as never, data: {}, filename, prefix: '' })

const req = {
  headers: new Headers(),
  payload: { logger: { error: vi.fn() } },
} as unknown as PayloadRequest

describe('Cloudinary adapter local delivery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('hands out the public/ path for mirrored media', async () => {
    const adapter = adapterFor('media', {
      publicFiles: { media: { 'Frame 366.png': '/media/Frame%20366.png' } },
    })

    expect(await generateURL(adapter, 'Frame 366.png')).toBe('/media/Frame%20366.png')
  })

  test('keeps the Cloudinary URL for files that were never mirrored', async () => {
    const adapter = adapterFor('media', { publicFiles: { media: {} } })

    expect(await generateURL(adapter, 'new-upload.png')).toMatch(
      /^https:\/\/res\.cloudinary\.com\/demo\/image\/upload\/.*skywings\/media\/new-upload\.png/,
    )
  })

  test('only lists files the repo actually carries', () => {
    for (const url of Object.values(localDeliveryManifest.publicFiles.media)) {
      const filePath = path.join(process.cwd(), 'public', ...url.split('/').map(decodeURIComponent))
      expect(existsSync(filePath), url).toBe(true)
    }

    for (const [slug, files] of Object.entries(localDeliveryManifest.uploadDirFiles)) {
      for (const filename of files ?? []) {
        expect(existsSync(path.join(process.cwd(), slug, filename)), `${slug}/${filename}`).toBe(true)
      }
    }
  })

  test('serves listed files of proxied collections from their upload folder', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const response = await adapterFor('three-d-assets', {
      uploadDirFiles: { 'three-d-assets': ['arm-1.glb'] },
    }).staticHandler(req, { params: { collection: 'three-d-assets', filename: 'arm-1.glb' } })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('model/gltf-binary')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('proxies Cloudinary for anything the manifest does not list', async () => {
    const fetchSpy = vi.fn(async () => new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchSpy)

    await adapterFor('three-d-assets', { uploadDirFiles: { 'three-d-assets': [] } }).staticHandler(req, {
      params: { collection: 'three-d-assets', filename: 'arm-1.glb' },
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
  })
})
