'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type CSSProperties } from 'react'

import { ChevronRightIcon } from '@/components/atoms/icons'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { MediaImage } from '@/data/media'

import { groupVariants, REVEAL_VIEWPORT, revealVariants } from './Reveal'
import { useDraggableRail } from './useDraggableRail'

export type CarouselCard = {
  description: null | string
  href: null | string
  id: string
  image: MediaImage | null
  number: string
  title: string
}

/**
 * Draggable card rail.
 *
 * The drag engine lives in useDraggableRail, shared with the product
 * gallery. The rail bleeds to both viewport edges and pads its start to the
 * text column, so the first card lines up with the heading and cards leave
 * the screen at the true edges instead of being cut by the container.
 *
 * This rail does not advance on its own; the product gallery one does.
 */
export function CardCarousel(props: {
  cards: CarouselCard[]
  cardsPerView: number
  showControls: boolean
}) {
  const { cards, cardsPerView, showControls } = props
  const reduced = useReducedMotion() ?? false
  const { edges, step, trackRef, viewportRef } = useDraggableRail({
    count: cards.length,
    itemSelector: '.industry-carousel-item',
  })

  const style = { '--cards-per-view': cardsPerView } as CSSProperties
  const controls = showControls && cards.length > 1

  return (
    <div className="industry-carousel" style={style}>
      {controls ? (
        <button
          aria-label="Previous cards"
          className="industry-carousel-control is-prev"
          disabled={edges.atStart}
          onClick={() => step(-1)}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      ) : null}

      <motion.div
        className="industry-carousel-viewport"
        initial="hidden"
        ref={viewportRef}
        variants={groupVariants(reduced, 0.1)}
        viewport={REVEAL_VIEWPORT}
        whileInView="visible"
      >
        <ul className="industry-carousel-track" ref={trackRef}>
          {cards.map((card) => {
            const Frame = card.href ? 'a' : 'div'

            return (
              <motion.li
                className="industry-carousel-item"
                key={card.id}
                variants={revealVariants('up', reduced, 1)}
              >
                <span aria-hidden="true" className="industry-card-number">
                  {card.number}
                </span>
                <Frame className="industry-card" draggable={false} href={card.href ?? undefined}>
                  <span className="industry-card-media">
                    {card.image ? (
                      <Image
                        alt={card.image.alt}
                        draggable={false}
                        fill
                        loading="lazy"
                        sizes="(min-width: 64rem) 24vw, (min-width: 48rem) 40vw, 75vw"
                        src={card.image.url}
                      />
                    ) : null}
                  </span>
                  <span className="industry-card-title">{card.title}</span>
                  {card.description ? (
                    <span className="industry-card-desc">{card.description}</span>
                  ) : null}
                </Frame>
              </motion.li>
            )
          })}
        </ul>
      </motion.div>

      {controls ? (
        <button
          aria-label="Next cards"
          className="industry-carousel-control is-next"
          disabled={edges.atEnd}
          onClick={() => step(1)}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      ) : null}
    </div>
  )
}
