import type { Block } from 'payload'

import { BrochureBlock } from './BrochureBlock'
import { CardCarouselBlock } from './CardCarouselBlock'
import { CustomProductCtaBlock } from './CustomProductCtaBlock'
import { FAQBlock } from './FAQBlock'
import { IndustryHeroBlock } from './IndustryHeroBlock'
import { IndustryIntroBlock } from './IndustryIntroBlock'
import { IndustryValueBlock } from './IndustryValueBlock'
import { LogoCloudBlock } from './LogoCloudBlock'
import { ProductGalleryBlock } from './ProductGalleryBlock'
import { RichTextBlock } from './RichTextBlock'

/**
 * Blocks offered to industry pages, in the order an editor is most likely to
 * reach for them. None of these carry industry-specific assumptions, so the
 * same set builds Aviation GSE, Marine, Oil & Gas or anything after them.
 */
export const industryPageBlocks: Block[] = [
  IndustryHeroBlock,
  IndustryIntroBlock,
  CardCarouselBlock,
  IndustryValueBlock,
  ProductGalleryBlock,
  BrochureBlock,
  CustomProductCtaBlock,
  FAQBlock,
  LogoCloudBlock,
  RichTextBlock,
]
