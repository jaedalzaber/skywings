'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { ChevronRightIcon } from '@/components/atoms/icons'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { MediaImage } from '@/data/media'

import { groupVariants, REVEAL_VIEWPORT, revealVariants } from './Reveal'

export type CarouselCard = {
  description: null | string
  href: null | string
  id: string
  image: MediaImage | null
  number: string
  title: string
}

type Controls = { step: (direction: -1 | 1) => void }

/**
 * Draggable card rail.
 *
 * The track is a transform-driven GSAP Draggable rather than a native
 * scroller: that is what gives it momentum, edge resistance and snapping to
 * card edges from mouse, touch and trackpad alike. The rail bleeds to both
 * viewport edges and pads its start to the text column, so the first card
 * lines up with the heading and cards leave the screen at the true edges
 * instead of being cut by the content container.
 *
 * Buttons, horizontal wheel and keyboard focus all move through the same
 * snap points, so every input agrees on where a "card" is. With reduced
 * motion the rail still drags, but without inertia.
 */
export function CardCarousel(props: {
  cards: CarouselCard[]
  cardsPerView: number
  showControls: boolean
}) {
  const { cards, cardsPerView, showControls } = props
  const reduced = useReducedMotion() ?? false
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const controlsRef = useRef<Controls | null>(null)
  const [edges, setEdges] = useState({ atEnd: false, atStart: true })

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    let active = true
    let cleanup: (() => void) | undefined

    async function setup() {
      const [{ gsap }, { Draggable }, { InertiaPlugin }] = await Promise.all([
        import('gsap'),
        import('gsap/Draggable'),
        import('gsap/InertiaPlugin'),
      ])

      if (!active || !viewport || !track) return

      gsap.registerPlugin(Draggable, InertiaPlugin)

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let minX = 0
      let snapPoints: number[] = []

      const nearest = (value: number) =>
        snapPoints.reduce(
          (best, point) => (Math.abs(point - value) < Math.abs(best - value) ? point : best),
          snapPoints[0] ?? 0,
        )

      const currentX = () => Number(gsap.getProperty(track, 'x')) || 0

      const updateEdges = () => {
        const x = currentX()
        setEdges({ atEnd: x <= minX + 1, atStart: x >= -1 })
      }

      // Cards are links: the browser would otherwise start a native link/image
      // drag and cancel the pointer sequence before Draggable sees it.
      const onDragStart = (event: Event) => event.preventDefault()
      track.addEventListener('dragstart', onDragStart)

      const [drag] = Draggable.create(track, {
        activeCursor: 'grabbing',
        bounds: { maxX: 0, minX: 0 },
        cursor: 'grab',
        // Drags may begin on the card links themselves; a real click still
        // navigates because Draggable suppresses clicks after movement.
        dragClickables: true,
        edgeResistance: 0.82,
        inertia: !reducedMotion,
        onDrag: updateEdges,
        onDragEnd: () => {
          if (reducedMotion) goTo(nearest(currentX()))
        },
        onThrowUpdate: updateEdges,
        snap: reducedMotion ? undefined : { x: nearest },
        type: 'x',
        zIndexBoost: false,
      })

      const measure = () => {
        const items = [...track.querySelectorAll<HTMLElement>('.industry-carousel-item')]
        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0
        const overflow = track.scrollWidth - viewport.clientWidth

        minX = Math.min(0, -overflow)
        snapPoints = items.map((item) => Math.max(minX, -(item.offsetLeft - padLeft)))
        drag.applyBounds({ maxX: 0, minX })
      }

      const goTo = (x: number, duration = 0.7) => {
        gsap.to(track, {
          duration: reducedMotion ? 0 : duration,
          ease: 'power3.out',
          onComplete: updateEdges,
          onUpdate: () => {
            drag.update()
            updateEdges()
          },
          overwrite: true,
          x: gsap.utils.clamp(minX, 0, x),
        })
      }

      controlsRef.current = {
        step: (direction) => {
          const x = currentX()
          const target =
            direction > 0
              ? (snapPoints.find((point) => point < x - 1) ?? minX)
              : ([...snapPoints].reverse().find((point) => point > x + 1) ?? 0)

          goTo(target)
        },
      }

      // Trackpad / shift+wheel horizontal scrolling.
      const onWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
        event.preventDefault()
        goTo(currentX() - event.deltaX, 0.35)
      }

      // Keyboard users tabbing through card links get the card brought into
      // view. Pointer presses also focus the link, so only keyboard focus
      // (`:focus-visible`) counts — otherwise the first drag on a card would
      // be fighting a tween back to that card's resting position.
      const onFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement
        const item = target.closest<HTMLElement>('.industry-carousel-item')
        if (!item || drag.isPressed || drag.isDragging || !target.matches(':focus-visible')) return

        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0
        goTo(-(item.offsetLeft - padLeft))
      }

      const observer = new ResizeObserver(() => {
        measure()
        goTo(nearest(currentX()), 0.3)
      })

      measure()
      updateEdges()
      observer.observe(viewport)
      viewport.addEventListener('wheel', onWheel, { passive: false })
      track.addEventListener('focusin', onFocus)

      cleanup = () => {
        observer.disconnect()
        viewport.removeEventListener('wheel', onWheel)
        track.removeEventListener('focusin', onFocus)
        track.removeEventListener('dragstart', onDragStart)
        drag.kill()
        gsap.killTweensOf(track)
        gsap.set(track, { clearProps: 'transform,cursor,touchAction,userSelect' })
        controlsRef.current = null
      }
    }

    void setup()

    return () => {
      active = false
      cleanup?.()
    }
  }, [cards.length])

  const style = { '--cards-per-view': cardsPerView } as CSSProperties
  const controls = showControls && cards.length > 1

  return (
    <div className="industry-carousel" style={style}>
      {controls ? (
        <button
          aria-label="Previous cards"
          className="industry-carousel-control is-prev"
          disabled={edges.atStart}
          onClick={() => controlsRef.current?.step(-1)}
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
          onClick={() => controlsRef.current?.step(1)}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      ) : null}
    </div>
  )
}
