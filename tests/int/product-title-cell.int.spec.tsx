import { cleanup, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DefaultCellComponentProps } from 'payload'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// Payload's own cell is what carries the link; stand it in with something
// that shows whether the link reached it.
vi.mock('@payloadcms/ui', () => ({
  DefaultCell: (props: { cellData?: unknown; link?: boolean }) => (
    <span className="default-cell" data-link={props.link ? 'true' : 'false'}>
      {String(props.cellData)}
    </span>
  ),
  useConfig: () => ({ config: { routes: { api: '/api' } } }),
}))
vi.mock('@/components/admin/ProductTitleCell.scss', () => ({}))

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const cell = (rowData: Record<string, unknown>, link = true) =>
  ({ cellData: rowData.title, collectionSlug: 'products', link, rowData }) as unknown as DefaultCellComponentProps

describe('product title cell', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  /*
   * Payload links whichever column comes first. A thumbnail column placed
   * ahead of the title took that link with it and left every row
   * unclickable, so the image lives inside the title cell and the name is
   * still Payload's own DefaultCell, link and all.
   */
  test('keeps the title as the clickable part of the row', async () => {
    const { ProductTitleCell } = await import('@/components/admin/ProductTitleCell')
    const { container } = render(<ProductTitleCell {...cell({ title: 'Meal Tray' })} />)

    const name = container.querySelector('.default-cell')
    expect(name?.textContent).toBe('Meal Tray')
    expect(name?.getAttribute('data-link')).toBe('true')

    const products = read('src/collections/Products.ts')
    expect(products).toMatch(/defaultColumns: \['title', 'sku'/)
    expect(products).toMatch(
      /name: 'title',[\s\S]*?Cell: '\/components\/admin\/ProductTitleCell#ProductTitleCell'/,
    )
    expect(products).not.toMatch(/cardPreview/)
    // A component the import map does not carry silently renders as nothing.
    expect(read('src/app/(payload)/admin/importMap.js')).toContain(
      '/components/admin/ProductTitleCell#ProductTitleCell',
    )
  })

  /*
   * The list is read at depth 0, so the image is a bare id. Every cell on a
   * page asks in the same tick and the lookups are sent as one request -- and
   * that request selects filename as well, because url is computed from it
   * and a select of url alone comes back null.
   */
  test('looks the images up in one request per page, and shows a small copy', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        docs: [
          { id: 190, url: 'https://res.cloudinary.com/x/image/upload/v1/skywings/media/a.png' },
          { id: 191, url: 'https://res.cloudinary.com/x/image/upload/v1/skywings/media/b.png' },
        ],
      }),
    })
    const { ProductTitleCell } = await import('@/components/admin/ProductTitleCell')

    const { container } = render(
      <>
        <ProductTitleCell {...cell({ thumbnailImage: 190, title: 'PKC 2K3P Pallet' })} />
        <ProductTitleCell {...cell({ featuredImage: 191, thumbnailImage: null, title: 'Oxygen Cart' })} />
      </>,
    )

    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const requested = decodeURIComponent(String(fetchMock.mock.calls[0][0]))
    expect(requested).toMatch(/^\/api\/media\?/)
    expect(requested).toMatch(/where\[id\]\[in\]=190,191/)
    expect(requested).toMatch(/select\[url\]=true/)
    expect(requested).toMatch(/select\[filename\]=true/)

    // Forty pixels on screen do not need the original upload.
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://res.cloudinary.com/x/image/upload/c_limit,w_96,f_auto,q_auto/v1/skywings/media/a.png',
    )
  })

  test('shows a placeholder, and asks for nothing, when there is no image', async () => {
    const { ProductTitleCell } = await import('@/components/admin/ProductTitleCell')
    const { container } = render(
      <ProductTitleCell {...cell({ featuredImage: null, thumbnailImage: null, title: 'Meal Tray' })} />,
    )

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.product-title-cell__thumb--empty')).not.toBeNull()
    await new Promise((settle) => setTimeout(settle, 10))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  /* A URL can be on file for an image no longer on the CDN; that row reads
     as missing a photograph rather than as a broken image. */
  test('falls back to the placeholder when the image fails to load', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ docs: [{ id: 300, url: 'https://cdn.example/missing.png' }] }),
    })
    const { ProductTitleCell } = await import('@/components/admin/ProductTitleCell')
    const { container } = render(<ProductTitleCell {...cell({ thumbnailImage: 300, title: 'Gone' })} />)

    const img = await waitFor(() => {
      const found = container.querySelector('img')
      expect(found).not.toBeNull()
      return found as HTMLImageElement
    })
    img.dispatchEvent(new Event('error'))

    await waitFor(() => expect(container.querySelector('.product-title-cell__thumb--empty')).not.toBeNull())
  })

  /*
   * No virtual field on the product: one would resolve on every read,
   * including the catalogue's query of the whole range, to serve ten rows of
   * this one screen.
   */
  test('costs the rest of the site nothing', () => {
    const products = read('src/collections/Products.ts')

    expect(products).not.toMatch(/virtual: 'thumbnailImage\.url'/)
    expect(products).not.toMatch(/virtual: 'featuredImage\.url'/)
  })
})
