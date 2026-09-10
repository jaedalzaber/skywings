import type { Product } from '@/payload-types'

const SIDES = ['top', 'right', 'bottom', 'left'] as const
type Side = (typeof SIDES)[number]

/**
 * How far a product render sits in from each edge of its catalogue card, as
 * a percentage. Null takes the site default for that side.
 */
export type CardImageInset = Record<Side, number | null>

type InsetFields = Pick<
  Product,
  | 'cardImagePadding'
  | 'cardImagePaddingBottom'
  | 'cardImagePaddingLeft'
  | 'cardImagePaddingRight'
  | 'cardImagePaddingTop'
>

/**
 * Each side's own value when an editor set one, else the all-sides value.
 * Null when nothing is set at all, so the card keeps the stylesheet default.
 */
export function resolveCardImageInset(product: InsetFields): CardImageInset | null {
  const all = product.cardImagePadding ?? null
  const inset: CardImageInset = {
    bottom: product.cardImagePaddingBottom ?? all,
    left: product.cardImagePaddingLeft ?? all,
    right: product.cardImagePaddingRight ?? all,
    top: product.cardImagePaddingTop ?? all,
  }

  return SIDES.every((side) => inset[side] === null) ? null : inset
}

/*
 * A contained image is centred in its box, so a side set to 0 would still
 * leave a gap on that side whenever the image's shape doesn't match the box.
 * Anchoring it toward the zero side is what makes it actually meet the edge.
 */
function anchor(start: number | null, end: number | null, startName: string, endName: string) {
  if (start === 0 && end !== 0) return startName
  if (end === 0 && start !== 0) return endName
  return 'center'
}

/**
 * The card canvas's custom properties for an inset, and whether the image
 * should fill the card: 0 on every side means edge to edge, cropping to fit.
 */
export function cardImageLayout(inset: CardImageInset | null): {
  fill: boolean
  style: Record<string, string> | undefined
} {
  if (!inset) return { fill: false, style: undefined }

  const style: Record<string, string> = {}
  for (const side of SIDES) {
    if (inset[side] !== null) style[`--catalogue-card-pad-${side}`] = `${inset[side]}%`
  }

  const x = anchor(inset.left, inset.right, 'left', 'right')
  const y = anchor(inset.top, inset.bottom, 'top', 'bottom')
  if (x !== 'center' || y !== 'center') style['--catalogue-card-align'] = `${x} ${y}`

  return { fill: SIDES.every((side) => inset[side] === 0), style }
}
