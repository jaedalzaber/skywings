import { render, screen, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { IndustryProductRail } from '@/components/home/IndustryProductRail'
import { defaultHomeLayout } from '@/data/home'
import { productCardImages } from '@/data/productCardImages'

const homeSourcePath = resolve(process.cwd(), 'src/data/home.ts')
const homeSource = existsSync(homeSourcePath) ? readFileSync(homeSourcePath, 'utf8') : ''
const cardImagesSource = readFileSync(
  resolve(process.cwd(), 'src/data/productCardImages.ts'),
  'utf8',
)
const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

describe('HomeIndustriesAccordion', () => {
  /*
   * Five cards, not six: Custom Metal Fabrication is excluded from the landing
   * page -- it names a way of working rather than a sector. getHomeIndustryItems
   * filters it out of the live query and defaultHomeLayout matches, so the
   * fallback and the CMS data agree.
   */
  test('renders the industries accordion directly after the services section with five cards', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    const servicesSection = container.querySelector('.services-grid')
    const industriesSection = container.querySelector('#industries')
    const industriesQueries = within(industriesSection as HTMLElement)

    expect(servicesSection?.nextElementSibling).toBe(industriesSection)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Metalwork built around your industry requirements.',
      }),
    ).toBeTruthy()
    expect(industriesQueries.getByText('Industries we serve')).toBeTruthy()
    expect(industriesQueries.getByText('Construction & Infrastructure')).toBeTruthy()
    expect(industriesQueries.getByText('01')).toBeTruthy()
    expect(industriesQueries.getByText('Architectural & Interior Metalwork')).toBeTruthy()
    expect(industriesQueries.queryByText('Custom Metal Fabrication')).toBeNull()
    expect(
      industriesQueries.getAllByRole('link', { name: 'Browse Related Products' }),
    ).toHaveLength(5)
    expect(
      industriesQueries
        .getAllByRole('link', { name: 'Browse Related Products' })[0]
        ?.getAttribute('href'),
    ).toBe('#products')
    expect(container.querySelector('#products')).not.toBeNull()
    expect(container.querySelectorAll('.industries-showcase-card')).toHaveLength(5)
  })

  test('uses product card thumbnails in industry product cards', () => {
    // Through the helper the products page uses, so the two cannot drift.
    expect(homeSource).toMatch(/productCardImages\(product\)/)
    expect(cardImagesSource).toMatch(
      /getMediaImage\(product\.thumbnailImage\)\s*\?\?\s*getMediaImage\(product\.featuredImage\)/,
    )
  })

  /*
   * The products page's card system on the home rail: the product's own
   * padding from the admin, and the second image on hover. The two pages read
   * one helper, so a padding or a hover pick set in the admin shows the same
   * wherever the product appears.
   */
  test('decides a card image, its hover image and its padding once for every card', () => {
    const media = (id: number) => ({ alt: `m${id}`, id, mimeType: 'image/png', url: `/m${id}.png` })
    const base = { featuredImage: media(1), gallery: [{ image: media(1) }, { image: media(2) }] }

    // The gallery's first image that is not already the card image.
    expect(productCardImages(base as never).hoverImage).toEqual({ alt: 'm2', url: '/m2.png' })
    // An editor's own pick wins.
    expect(productCardImages({ ...base, cardHoverImage: media(3) } as never).hoverImage?.url).toBe(
      '/m3.png',
    )
    // Nothing else to show: no hover.
    expect(productCardImages({ featuredImage: media(1) } as never).hoverImage).toBeNull()
    expect(
      productCardImages({ ...base, cardImagePadding: 8, cardImagePaddingBottom: 0 } as never)
        .imageInset,
    ).toEqual({ bottom: 0, left: 8, right: 8, top: 8 })
  })

  const railProduct = (over: Record<string, unknown> = {}) => ({
    // A product with its own page: only those are links, with a hover view.
    hasPage: true,
    id: 1,
    image: { alt: 'Stand', url: '/stand.png' },
    slug: 'stand',
    summary: '',
    title: 'Maintenance Stand',
    ...over,
  })

  test('pads a rail card by the product’s own values, or the rail’s 5% default', () => {
    const { container } = render(
      <IndustryProductRail
        ctaHref="/products"
        products={[
          railProduct({ id: 1, imageInset: { bottom: 12, left: 12, right: 12, top: 12 } }),
          railProduct({ id: 2, slug: 'plain' }),
          railProduct({
            id: 3,
            imageInset: { bottom: 0, left: 0, right: 0, top: 0 },
            slug: 'full',
          }),
        ]}
      />,
    )
    const frames = Array.from(
      container.querySelectorAll('.industries-showcase-product-frame'),
    ) as HTMLElement[]

    // The same properties the catalogue card reads, set from the admin values.
    expect(frames[0].style.getPropertyValue('--catalogue-card-pad-top')).toBe('12%')
    expect(frames[1].getAttribute('style')).toBeNull()
    // 0 on every side fills the frame, cropped, as on the products page.
    expect(frames[2].getAttribute('data-fill')).toBe('true')
    expect(frames[0].querySelector('.industries-showcase-product-fit img')).not.toBeNull()

    expect(stylesheet).toMatch(
      /\.industries-showcase-product-frame \{[^}]*--industries-product-pad: 5%;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-fit \{[^}]*inset: var\(--catalogue-card-pad-top, var\(--industries-product-pad\)\)/s,
    )
    // The old fixed padding on the image itself is gone.
    expect(stylesheet).not.toMatch(
      /\.industries-showcase-product-image \{[^}]*padding: clamp\(0\.5rem, 1\.1vw, 0\.875rem\)/s,
    )
  })

  test('fades a second image across a rail card on hover, as on the products page', () => {
    const { container } = render(
      <IndustryProductRail
        ctaHref="/products"
        products={[
          railProduct({ hoverImage: { alt: '', url: '/stand-photo.png' }, id: 1 }),
          railProduct({ id: 2, slug: 'single' }),
        ]}
      />,
    )
    const cards = Array.from(container.querySelectorAll('.industries-showcase-product-card'))

    const hover = cards[0].querySelector('.industries-showcase-product-hover')
    expect(hover).not.toBeNull()
    // Another angle on a product the card already names: decorative.
    expect(hover?.getAttribute('aria-hidden')).toBe('true')
    expect(cards[1].querySelector('.industries-showcase-product-hover')).toBeNull()

    expect(stylesheet).toMatch(
      /\.industries-showcase-product-link:is\(:hover, :focus-visible\) \.industries-showcase-product-hover \{\s*opacity: 1;/,
    )
    expect(stylesheet).toMatch(/\.industries-showcase-product-hover-image \{\s*object-fit: cover;/)
  })

  test('supports up to twelve CMS products and activates motion only above three', () => {
    const products = Array.from({ length: 4 }, (_, index) => ({
      hasPage: true,
      id: index + 1,
      image: null,
      slug: `product-${index + 1}`,
      summary: '',
      title: `Product ${index + 1}`,
    }))
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)
    const rail = container.querySelector('.industries-showcase-product-grid')
    const sets = container.querySelectorAll('.industries-showcase-product-set')

    // Twelve on the rail, cut after finished products have been moved to the front.
    expect(homeSource).toMatch(/pagesFirst\([\s\S]*?\)\.slice\(0, 12\)/)
    expect(homeSource).toMatch(/getCuratedProductsById\(relatedProductIds\)/)
    expect(homeSource).toMatch(/in:\s*numericProductIds/)
    expect(rail?.getAttribute('data-moving')).toBe('true')
    expect(sets).toHaveLength(2)
    expect(sets[1]?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll('.industries-showcase-product-card')).toHaveLength(8)
  })

  test('keeps three-product rails static without duplicate content', () => {
    const products = Array.from({ length: 3 }, (_, index) => ({
      hasPage: true,
      id: index + 1,
      image: null,
      slug: `product-${index + 1}`,
      summary: '',
      title: `Product ${index + 1}`,
    }))
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)

    expect(
      container.querySelector('.industries-showcase-product-grid')?.getAttribute('data-moving'),
    ).toBeNull()
    expect(container.querySelectorAll('.industries-showcase-product-set')).toHaveLength(1)
  })

  // Only a product with a page to open is a link; the rest are shown still.
  test('links only the products that have a page', () => {
    const products = [
      { hasPage: true, id: 1, image: null, slug: 'folding-stand', summary: '', title: 'Stand' },
      {
        hasPage: false,
        hoverImage: { alt: '', url: '/cowl-2.png' },
        id: 2,
        image: null,
        slug: 'cowl-pylon-ladders',
        summary: '',
        title: 'Ladders',
      },
    ]
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)
    const links = container.querySelectorAll('a.industries-showcase-product-link')

    expect(links).toHaveLength(1)
    expect(links[0]?.getAttribute('href')).toBe('/products/folding-stand')
    expect(container.querySelector('[data-static] .industries-showcase-product-hover')).toBeNull()
    expect(container.textContent).toContain('Ladders')
  })
})
