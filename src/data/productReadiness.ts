import type { Product } from '@/payload-types'

import { relationId } from './relations'

/*
 * Most of the catalogue is a name and a render so far: the shelf is complete,
 * the pages behind it are not. A product earns a page -- a card that links, a
 * place at the front of a list -- once it has what that page is built from:
 * photographs for the gallery and a written description. Until then it is
 * still shown, because a buyer should see that it is made, but nothing sends
 * them to a page that would be a heading over empty sections.
 *
 * Derived rather than ticked in the admin, so a product goes live the moment
 * an editor finishes filling it in, and cannot be switched on half-written.
 */

function hasText(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false

  const { children, text } = node as { children?: unknown; text?: unknown }
  if (typeof text === 'string' && text.trim()) return true

  return Array.isArray(children) && children.some(hasText)
}

export function hasProductPage(product: Pick<Product, 'description' | 'gallery'>): boolean {
  const photographed = (product.gallery ?? []).some((item) => Boolean(relationId(item.image)))

  return photographed && hasText(product.description?.root)
}

/**
 * Products with a page ahead of those without, each group keeping the order
 * it came in -- an editor's curation or a relevance ranking survives inside it.
 */
export function pagesFirst<T>(items: T[], hasPage: (item: T) => boolean): T[] {
  return [...items.filter(hasPage), ...items.filter((item) => !hasPage(item))]
}

const titleCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/** Numbers compared as numbers, so LD2 comes before LD11 rather than after it. */
export function compareTitles(a: string, b: string) {
  return titleCollator.compare(a, b)
}
