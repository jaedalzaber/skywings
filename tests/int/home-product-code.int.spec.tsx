import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { IndustryProductRail } from '@/components/home/IndustryProductRail'
import type { HomeIndustryProduct } from '@/data/home'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')

const products: HomeIndustryProduct[] = [
  {
    id: 1,
    image: { alt: 'Folding stand', url: '/api/media/file/folding-stand.png' },
    sku: 'GSE-FS-038',
    slug: 'folding-stand',
    summary: 'Foldable work stand.',
    title: 'Folding Stand',
  },
  {
    id: 2,
    image: null,
    slug: 'unlisted',
    summary: 'No code on file.',
    title: 'Unlisted Product',
  },
]

/*
 * The product code, in the corner of a home card over the image, as the
 * detail page sets it under the title. A visitor quotes it back to us, so it
 * belongs on the card they were looking at rather than one click away.
 */
describe('home product code', () => {
  afterEach(cleanup)

  test('sets the code in the corner of the card, and nothing when there is none', () => {
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)

    const codes = Array.from(container.querySelectorAll('.industries-showcase-product-code'))
    // One per card that has a code, across both the real and duplicate tracks.
    expect(codes.length).toBeGreaterThan(0)
    expect(new Set(codes.map((el) => el.textContent))).toEqual(new Set(['GSE-FS-038']))

    // It sits inside the image frame, not under the title.
    expect(codes[0].parentElement?.className).toBe('industries-showcase-product-frame')

    expect(stylesheet).toMatch(
      /\.industries-showcase-product-code \{[^}]*position: absolute;[^}]*top: 0\.5rem;[^}]*right: 0\.6rem;/s,
    )
    expect(stylesheet).toMatch(/\.industries-showcase-product-code \{[^}]*color: #1f7a4d;/s)
    // Small, and set in the monospace face the site uses for codes.
    expect(stylesheet).toMatch(/\.industries-showcase-product-code \{[^}]*font-size: 0\.625rem;/s)
  })

  test('carries the code from the product, alongside the image', () => {
    const home = read('src/data/home.ts')

    expect(home).toMatch(/sku: product\.sku \?\? null,/)
    // Optional: the placeholder products a sparse industry falls back to
    // have no code, and must still type-check.
    expect(home).toMatch(/sku\?: string \| null/)
  })
})
