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
 * defers its media. The first intro block owns the page `<h1>`.
 */
export function IndustryBlocks(props: { blocks: IndustryPageLayout }) {
  const firstIntro = props.blocks.findIndex((block) => block.blockType === 'industryIntro')

  return (
    <div className="industry-page">
      {props.blocks.map((block, index) => (
        <IndustryBlock
          block={block}
          isFirst={index === 0}
          isTitle={index === firstIntro}
          key={`${block.blockType}-${block.id ?? index}`}
        />
      ))}
    </div>
  )
}

function IndustryBlock(props: { block: IndustryPageBlock; isFirst: boolean; isTitle: boolean }) {
  const { block, isFirst, isTitle } = props

  switch (block.blockType) {
    case 'industryHero':
      return <IndustryHeroSection block={block} priority={isFirst} />
    case 'industryIntro':
      return <IndustryIntroSection block={block} headingLevel={isTitle ? 'h1' : 'h2'} />
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
