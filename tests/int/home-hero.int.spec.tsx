import { render, screen } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout, type HomeLayout } from '@/data/home'
import type { MediaFile, MediaImage } from '@/data/media'

const heroBlockSourcePath = resolve(process.cwd(), 'src/blocks/HomeHeroBlock.ts')
const heroBlockSource = existsSync(heroBlockSourcePath)
  ? readFileSync(heroBlockSourcePath, 'utf8')
  : ''
const migrationsIndexPath = resolve(process.cwd(), 'src/migrations/index.ts')
const migrationsIndexSource = existsSync(migrationsIndexPath)
  ? readFileSync(migrationsIndexPath, 'utf8')
  : ''

function image(overrides: Partial<MediaImage>): MediaImage {
  return {
    alt: 'Hero cover media',
    url: '/hero-cover.png',
    ...overrides,
  }
}

function video(overrides: Partial<MediaFile>): MediaFile {
  return {
    alt: 'Hero cover video',
    mimeType: 'video/mp4',
    url: '/hero-cover.mp4',
    ...overrides,
  }
}

describe('HomeHero', () => {
  test('renders a full-screen hero container with a video-ready background layer', () => {
    const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const hero = container.querySelector('#top')

    expect(hero?.classList.contains('hero-section')).toBe(true)
    expect(hero?.classList.contains('hero-container')).toBe(true)
    expect(hero?.querySelector('.hero-video-layer')).not.toBeNull()
    expect(hero?.querySelector('.hero-content-band')).not.toBeNull()
    expect(hero?.querySelector('.hero-services-marquee')).not.toBeNull()
    expect(hero?.querySelectorAll('.hero-services-track')).toHaveLength(2)
    expect(screen.getAllByText('Construction & Infrastructure')).toHaveLength(2)
    expect(screen.getAllByText('Aviation Ground Support Equipment')).toHaveLength(2)
    expect(hero?.querySelector('.wireframe-board')).toBeNull()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Metal products engineered, fabricated, and delivered to spec.',
      }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start an RFQ' }).getAttribute('href')).toBe(
      '/contact',
    )
  })

  test('supports CMS-selected image or video covers for desktop, laptop, and mobile', () => {
    const layout: HomeLayout = [
      {
        ...defaultHomeLayout.find((block) => block.blockType === 'homeHero')!,
        desktopCoverType: 'video',
        desktopCoverVideo: video({
          mimeType: 'video/mp4',
          url: '/uploads/desktop-hero.mp4',
        }),
        laptopCoverType: 'video',
        laptopCoverVideo: video({
          mimeType: 'video/webm',
          url: '/uploads/laptop-hero.webm',
        }),
        laptopCoverImage: image({
          alt: 'Laptop hero cover',
          url: '/uploads/laptop-hero.png',
        }),
        mobileCoverType: 'video',
        mobileCoverVideo: video({
          mimeType: 'video/mp4',
          url: '/uploads/mobile-hero.mp4',
        }),
        mobileCoverImage: image({
          alt: 'Mobile hero cover',
          url: '/uploads/mobile-hero.png',
        }),
      },
    ]

    const { container } = render(<HomeBlockRenderer blocks={layout} />)

    expect(container.querySelector('.hero-image img')?.getAttribute('src')).toBe(
      '/uploads/mobile-hero.png',
    )
    expect(
      container
        .querySelector(".hero-image source[media='(min-width: 48rem)']")
        ?.getAttribute('srcSet'),
    ).toBe('/uploads/laptop-hero.png')
    expect(container.querySelector('.hero-cover-video--desktop source')?.getAttribute('src')).toBe(
      '/uploads/desktop-hero.mp4',
    )
    expect(container.querySelector('.hero-cover-video--laptop source')?.getAttribute('src')).toBe(
      '/uploads/laptop-hero.webm',
    )
    expect(container.querySelector('.hero-cover-video--laptop source')?.getAttribute('type')).toBe(
      'video/webm',
    )
    expect(container.querySelector('.hero-cover-video--mobile source')?.getAttribute('src')).toBe(
      '/uploads/mobile-hero.mp4',
    )
    expect(container.querySelector('.hero-cover-video--mobile')?.getAttribute('poster')).toBe(
      '/uploads/mobile-hero.png',
    )
  })

  test('exposes hero cover media fields and migration for Payload admin', () => {
    expect(heroBlockSource).toMatch(/coverMediaFields\('desktop', 'Desktop'\)/)
    expect(heroBlockSource).toMatch(/coverMediaFields\('laptop', 'Laptop'\)/)
    expect(heroBlockSource).toMatch(/coverMediaFields\('mobile', 'Mobile'\)/)
    expect(heroBlockSource).toMatch(/\$\{prefix\}CoverImage/)
    expect(heroBlockSource).toMatch(/\$\{prefix\}CoverVideo/)
    expect(migrationsIndexSource).toContain('20260723_123000_home_hero_cover_media')
    expect(readFileSync(resolve(process.cwd(), 'src/data/home.ts'), 'utf8')).toContain(
      'hero-cover-media-v2',
    )
  })
})
