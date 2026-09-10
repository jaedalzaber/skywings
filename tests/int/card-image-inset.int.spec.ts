import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { cardImageLayout, resolveCardImageInset } from '@/data/cardImageInset'

describe('card image inset', () => {
  test('keeps the site default when nothing is set', () => {
    expect(resolveCardImageInset({})).toBeNull()
    expect(cardImageLayout(null)).toEqual({ fill: false, style: undefined })
  })

  test('lets a side override the all-sides value', () => {
    expect(resolveCardImageInset({ cardImagePadding: 8, cardImagePaddingBottom: 0 })).toEqual({
      bottom: 0,
      left: 8,
      right: 8,
      top: 8,
    })
  })

  test('fills the card only when every side is 0', () => {
    expect(cardImageLayout(resolveCardImageInset({ cardImagePadding: 0 })).fill).toBe(true)
    expect(
      cardImageLayout(resolveCardImageInset({ cardImagePadding: 0, cardImagePaddingTop: 5 })).fill,
    ).toBe(false)
  })

  test('anchors the image toward the sides set to 0', () => {
    const align = (fields: Parameters<typeof resolveCardImageInset>[0]) =>
      cardImageLayout(resolveCardImageInset(fields)).style?.['--catalogue-card-align']

    expect(align({ cardImagePaddingBottom: 0 })).toBe('center bottom')
    expect(align({ cardImagePaddingLeft: 0 })).toBe('left center')
    expect(align({ cardImagePaddingRight: 0, cardImagePaddingTop: 0 })).toBe('right top')
    // Both opposite sides at 0 already touch; nothing to pull toward.
    expect(align({ cardImagePaddingLeft: 0, cardImagePaddingRight: 0 })).toBeUndefined()
  })

  /*
   * The home rail's frame is far wider than most products: filling it cut
   * their ends off, so they are fitted whole with a small margin instead. The
   * margin is the products page's inset system -- the product's own padding
   * from the admin, else the rail's 5% default.
   */
  test('fits home industry rail products whole with a small inset', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(stylesheet).toMatch(/\n\.industries-showcase-product-image \{[^}]*object-fit: contain;/s)
    expect(stylesheet).toMatch(
      /\n\.industries-showcase-product-frame \{[^}]*--industries-product-pad: 5%;/s,
    )
    expect(stylesheet).toMatch(
      /\n\.industries-showcase-product-fit \{[^}]*inset: var\(--catalogue-card-pad-top, var\(--industries-product-pad\)\)/s,
    )
  })
})
