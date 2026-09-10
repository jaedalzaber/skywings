'use client'

import { DefaultCell, useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'
import { useEffect, useState } from 'react'

import './ProductTitleCell.scss'

/**
 * The Products list's title column, with the product's card image in front
 * of the name.
 *
 * It is the title cell rather than a column of its own on purpose. Payload
 * links whichever column comes first to the document, so a separate
 * thumbnail column placed ahead of the title took the link with it and left
 * every row unclickable. Here the name is still Payload's own DefaultCell --
 * the same link, the same trash-view and drawer handling -- with the image set
 * beside it.
 *
 * Seventy-five rows of "GSE-PMC-P6-052" are hard to tell apart by name alone,
 * so the image is how an editor finds the pallet they mean. It reads the same
 * pair the site's cards do -- the card thumbnail, else the featured image --
 * so the list shows what the catalogue will show.
 */

/*
 * The list is read at depth 0, so the image arrives as a bare media id. The
 * URL is looked up here rather than through a virtual field on the product:
 * a virtual field resolves on every read of a product, including the
 * catalogue's query of the whole range, and would have cost a query per row
 * across the site to serve ten rows of this one screen.
 *
 * Every cell on a page asks in the same tick, so the requests are gathered
 * and sent as one -- a page of the list is one lookup, not ten.
 */
type Resolve = (url: string | null) => void

const known = new Map<string, Promise<string | null>>()
const waiting = new Map<string, Resolve[]>()
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush(apiRoute: string) {
  flushTimer = null
  const batch = new Map(waiting)
  waiting.clear()

  const ids = [...batch.keys()]
  const params = new URLSearchParams({ depth: '0', limit: String(ids.length) })
  params.set('where[id][in]', ids.join(','))
  // url is computed from filename, so a select of url alone comes back null.
  params.set('select[url]', 'true')
  params.set('select[filename]', 'true')

  let found = new Map<string, string>()
  try {
    const response = await fetch(`${apiRoute}/media?${params.toString()}`, { credentials: 'include' })
    const body = (await response.json()) as { docs?: { id: number | string; url?: string | null }[] }
    found = new Map(
      (body.docs ?? [])
        .filter((doc) => typeof doc.url === 'string' && doc.url)
        .map((doc) => [String(doc.id), doc.url as string]),
    )
  } catch {
    // A failed lookup leaves the placeholder, which is the honest state.
  }

  for (const [id, resolvers] of batch) {
    for (const resolve of resolvers) resolve(found.get(id) ?? null)
  }
}

function lookUp(id: string, apiRoute: string): Promise<string | null> {
  const cached = known.get(id)
  if (cached) return cached

  const promise = new Promise<string | null>((resolve) => {
    const list = waiting.get(id) ?? []
    list.push(resolve)
    waiting.set(id, list)
  })
  known.set(id, promise)
  flushTimer ??= setTimeout(() => void flush(apiRoute), 0)

  return promise
}

/** The card image's id -- or, if a deeper read populated it, its URL. */
function imageRef(row: Record<string, unknown>): { id: string } | { url: string } | null {
  for (const key of ['thumbnailImage', 'featuredImage']) {
    const value = row[key]
    if (typeof value === 'number' || (typeof value === 'string' && value)) return { id: String(value) }
    if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
      return { url: (value as { url: string }).url }
    }
  }

  return null
}

/*
 * Forty pixels on screen do not need the original upload: a Cloudinary image
 * URL takes a transformation segment after /upload/, so the list asks for a
 * small, compressed copy instead of ten full-size renders per page.
 */
function smallCopyOf(url: string): string {
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/c_limit,w_96,f_auto,q_auto/')
    : url
}

function Placeholder() {
  return (
    <span className="product-title-cell__thumb product-title-cell__thumb--empty" title="No image">
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
        <rect height="15" rx="1.5" width="19" x="2.5" y="4.5" />
        <circle cx="8.5" cy="10" r="1.6" />
        <path d="m3.5 17 5-5 4.5 4.5 3-2.5 5 4" />
      </svg>
    </span>
  )
}

export function ProductTitleCell(props: DefaultCellComponentProps) {
  const { config } = useConfig()
  const apiRoute = config.routes?.api ?? '/api'
  const ref = imageRef((props.rowData ?? {}) as Record<string, unknown>)
  const refKey = ref ? ('id' in ref ? `id:${ref.id}` : `url:${ref.url}`) : ''

  const [lookup, setLookup] = useState<{ key: string; url: string | null } | null>(null)
  // A URL can be on file for an image no longer on the CDN; that row should
  // read as missing a photograph, not as a broken image.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!ref || !('id' in ref)) return

    let live = true
    void lookUp(ref.id, apiRoute).then((url) => {
      if (live) setLookup({ key: refKey, url })
    })

    return () => {
      live = false
    }
    // refKey carries everything about ref that matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refKey, apiRoute])

  const url = !ref ? null : 'url' in ref ? ref.url : lookup?.key === refKey ? lookup.url : null
  const src = url ? smallCopyOf(url) : null

  return (
    <span className="product-title-cell">
      {src && failedUrl !== src ? (
        <span className="product-title-cell__thumb">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin chrome, not a page image */}
          <img alt="" loading="lazy" onError={() => setFailedUrl(src)} src={src} />
        </span>
      ) : (
        <Placeholder />
      )}
      <DefaultCell {...props} />
    </span>
  )
}
