import { fireEvent, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, test } from 'vitest'

import { SafeImage, SafePicture, SafeVideo } from '@/components/atoms/SafeImage'

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
      .filter((file) => {
        const source = readFileSync(file, 'utf8')
        return /next\/image|<img\b/.test(source)
      })
      .map((file) => relative(process.cwd(), file))

    expect(offenders).toEqual([])
  })
})
