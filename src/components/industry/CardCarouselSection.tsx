import type { CardCarouselBlock } from '@/payload-types'

import { getMediaImage } from '@/data/media'

import { CardCarousel, type CarouselCard } from './CardCarousel'
import { Reveal } from './Reveal'
import { MultilineHeading, SectionShell } from './SectionShell'
import { headingId, SectionEyebrow } from './shared'

/**
 * Heading stays in the text column; the rail underneath is full-bleed so
 * cards can run off both edges of the screen.
 */
export function CardCarouselSection(props: { block: CardCarouselBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-carousel')

  const cards: CarouselCard[] = block.cards.map((card, index) => ({
    description: card.description?.trim() || null,
    href: card.href?.trim() || null,
    id: card.id ?? `${card.title}-${index}`,
    image: getMediaImage(card.image),
    number: card.numberOverride?.trim() || String(index + 1).padStart(2, '0'),
    title: card.title,
  }))

  if (cards.length === 0) {
    return null
  }

  return (
    <SectionShell
      anchorId={block.anchorId}
      bleed
      className="industry-carousel-section"
      labelledBy={id}
      theme={block.theme}
    >
      <div className="industry-container">
        <Reveal className="industry-carousel-head">
          <SectionEyebrow>{block.eyebrow}</SectionEyebrow>
          <MultilineHeading className="industry-carousel-heading" id={id} value={block.heading} />
        </Reveal>
      </div>

      <CardCarousel
        cards={cards}
        cardsPerView={block.cardsPerView ?? 4}
        showControls={block.showControls !== false}
      />
    </SectionShell>
  )
}
