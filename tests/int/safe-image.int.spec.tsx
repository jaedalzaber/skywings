import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { SafeImage, SafeImg, SafePicture, SafeVideo } from '@/components/atoms/SafeImage'

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) return listSourceFiles(fullPath)
    return /\.(tsx?|jsx?)$/.test(name) ? [fullPath] : []
  })
}

describe('SafeImage', () => {
  test('replaces failed Next images with a gray fallback box', () => {
    const { container } = render(
      <SafeImage alt="Missing product" height={100} src="/missing-product.png" width={200} />,
    )

    fireEvent.error(screen.getByAltText('Missing product'))

    const fallback = container.querySelector('.safe-image-fallback') as HTMLElement
    expect(fallback).toBeTruthy()
    expect(fallback.style.width).toBe('200px')
    expect(fallback.style.height).toBe('100px')
    expect(screen.queryByAltText('Missing product')).toBeNull()
  })

  /*
   * The <img> comes in the server HTML, so a missing file can fail before
   * React hydrates. That error event is never replayed to onError, which left
   * the browser's broken-image icon and alt text on the page. The component
   * now checks, once mounted, for an image that finished loading with nothing
   * to draw -- and decode() tells a broken file from a valid sizeless SVG.
   */
  describe('an image that failed before hydration', () => {
    const proto = HTMLImageElement.prototype
    const originals = {
      complete: Object.getOwnPropertyDescriptor(proto, 'complete'),
      decode: Object.getOwnPropertyDescriptor(proto, 'decode'),
      naturalWidth: Object.getOwnPropertyDescriptor(proto, 'naturalWidth'),
    }

    function loaded(decode: () => Promise<void>) {
      Object.defineProperty(proto, 'complete', { configurable: true, get: () => true })
      Object.defineProperty(proto, 'naturalWidth', { configurable: true, get: () => 0 })
      Object.defineProperty(proto, 'decode', { configurable: true, value: decode })
    }

    afterEach(() => {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(proto, key, descriptor)
        else delete (proto as unknown as Record<string, unknown>)[key]
      }
      cleanup()
    })

    test('is swapped for the fallback once mounted', async () => {
      loaded(() => Promise.reject(new Error('EncodingError')))
      const { container } = render(<SafeImg alt="Dangling upload" src="/gone.jpg" />)

      await waitFor(() => expect(container.querySelector('.safe-image-fallback')).toBeTruthy())
      expect(screen.queryByAltText('Dangling upload')).toBeNull()
    })

    test('is left alone when it decodes -- a valid image with no intrinsic size', async () => {
      loaded(() => Promise.resolve())
      const { container } = render(<SafeImg alt="Sizeless SVG" src="/mark.svg" />)

      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByAltText('Sizeless SVG')).toBeTruthy()
      expect(container.querySelector('.safe-image-fallback')).toBeNull()
    })
  })

  test('replaces failed picture images with a gray fallback box', () => {
    const { container } = render(
      <SafePicture
        className="hero-image"
        image={{ alt: 'Missing hero', src: '/missing-hero.png' }}
        sources={[{ media: '(min-width: 48rem)', srcSet: '/missing-hero-large.png' }]}
      />,
    )

    fireEvent.error(screen.getByAltText('Missing hero'))

    expect(container.querySelector('picture')).toBeNull()
    expect(container.querySelector('.safe-image-fallback.hero-image')).toBeTruthy()
  })

  test('keeps videos marked unloaded until the first frame is ready', () => {
    const { container } = render(
      <SafeVideo className="hero-cover-video" poster="/cover.png" src="/cover.mp4" />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    expect(video.dataset.loaded).toBe('false')

    fireEvent.loadedData(video)

    expect(video.dataset.loaded).toBe('true')
    expect(video.getAttribute('poster')).toBe('/cover.png')
  })

  test('keeps site images behind the safe fallback wrapper', () => {
    const offenders = listSourceFiles(join(process.cwd(), 'src'))
      .filter((file) => !file.endsWith(join('components', 'atoms', 'SafeImage.tsx')))
      // Payload admin cells render inside the CMS, not the site, and bring
      // their own fallback: the fallback wrapper is for public pages.
      .filter((file) => !file.includes(join('components', 'admin', '')))
      // Email bodies are HTML strings sent to an inbox: no React, no
      // next/image, and a plain <img> is the only thing mail clients render.
      .filter((file) => !file.includes(join('lib', 'email', '')))
      .filter((file) => !file.includes(join('lib', 'newsletter', '')))
      .filter((file) => {
        const source = readFileSync(file, 'utf8')
        return /next\/image|<img\b/.test(source)
      })
      .map((file) => relative(process.cwd(), file))

    expect(offenders).toEqual([])
  })
})
