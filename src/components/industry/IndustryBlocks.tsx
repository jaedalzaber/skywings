import type { IndustryPageBlock, IndustryPageLayout } from '@/data/industryPages'

import { BrochureSection } from './BrochureSection'
import { CardCarouselSection } from './CardCarouselSection'
import { CustomProductCtaSection } from './CustomProductCtaSection'
import { FaqSection } from './FaqSection'
import { IndustryHeroSection } from './IndustryHeroSection'
import { IndustryIntroSection } from './IndustryIntroSection'
import { IndustryValueSection } from './IndustryValueSection'
import { LogoCloudSection } from './LogoCloudSection'
import { ProductGallerySection } from './ProductGallerySection'
import { RichTextSection } from './RichTextSection'

/**
 * Maps a Payload block to its renderer. Adding a section to the CMS means
 * registering it here and nowhere else — there is no page-specific component
 * for any industry.
 *
 * The hero is the only block that loads eagerly; everything below the fold
 * defers its media.
 */
export function IndustryBlocks(props: { blocks: IndustryPageLayout }) {
  return (
    <>
      {props.blocks.map((block, index) => (
        <IndustryBlock
          block={block}
          isFirst={index === 0}
          key={`${block.blockType}-${block.id ?? index}`}
        />
      ))}
    </>
  )
}

function IndustryBlock(props: { block: IndustryPageBlock; isFirst: boolean }) {
  const { block, isFirst } = props

  switch (block.blockType) {
    case 'industryHero':
      return <IndustryHeroSection block={block} priority={isFirst} />
    case 'industryIntro':
      return <IndustryIntroSection block={block} />
    case 'cardCarousel':
      return <CardCarouselSection block={block} />
    case 'industryValue':
      return <IndustryValueSection block={block} />
    case 'productGallery':
      return <ProductGallerySection block={block} />
    case 'brochureDownload':
      return <BrochureSection block={block} />
    case 'customProductCta':
      return <CustomProductCtaSection block={block} />
    case 'faq':
      return <FaqSection block={block} />
    case 'logoCloud':
      return <LogoCloudSection block={block} />
    case 'richText':
      return <RichTextSection block={block} />
    default:
      return null
  }
}
