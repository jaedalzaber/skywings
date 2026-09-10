'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { HomeIndustryProduct } from '@/data/home'

const fallbackImage = '/images/industries/product-placeholder.png'

/*
 * How quickly the rail's speed converges on whatever it is heading for, as a
 * time constant in seconds. This is what turns the hover pause into a damped
 * glide: the CSS animation-play-state it replaces could only stop dead.
 */
const SPEED_TAU = 0.4
/* Past this the pointer counts as a drag, and the click that follows is
   suppressed so dragging across a card does not navigate to it. */
const DRAG_THRESHOLD = 4

function ProductCards(props: {
  ctaHref: string
  duplicate?: boolean
  products: HomeIndustryProduct[]
}) {
  const { ctaHref, duplicate = false, products } = props

  return products.map((product) => (
    <figure className="industries-showcase-product-card" key={`${product.id}-${duplicate}`}>
      <a
        className="industries-showcase-product-link"
        draggable={false}
        href={product.slug ? `/products/${product.slug}` : ctaHref}
        tabIndex={duplicate ? -1 : undefined}
      >
        <div className="industries-showcase-product-frame">
          <Image
            alt={duplicate ? '' : product.image?.alt || product.title}
            className="industries-showcase-product-image"
            draggable={false}
            fill
            loading="lazy"
            sizes="(max-width: 767px) 42vw, (max-width: 1439px) 18vw, 16vw"
            src={product.image?.url || fallbackImage}
          />
          {/* The product code, in the corner of the frame as on the detail
              page. Hidden from the duplicate track, which exists only to
              make the marquee loop and is already aria-hidden. */}
          {product.sku ? (
            <span className="industries-showcase-product-code">{product.sku}</span>
          ) : null}
        </div>
        <figcaption>{product.title}</figcaption>
      </a>
    </figure>
  ))
}

export function IndustryProductRail(props: {
  anchorId?: string
  ctaHref: string
  products: HomeIndustryProduct[]
}) {
  const { anchorId, ctaHref, products } = props
  const railRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const moves = products.length > 3
  const style = {
    '--industry-product-duration': `${Math.max(20, products.length * 5)}s`,
  } as CSSProperties

  useEffect(() => {
    const rail = railRef.current
    const track = trackRef.current
    if (!rail || !track || !moves) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    /*
     * The rail is driven here rather than by a CSS keyframe animation. Two of
     * the things it has to do are impossible with one: easing the speed to a
     * stop (animation-play-state is binary), and letting a drag take the rail
     * over and hand its momentum back.
     */
    let offset = 0
    let speed = 0
    let frame = 0
    let last = 0
    let inView = false
    let hovering = false

    // Drag state.
    let dragging = false
    let pointerId: number | null = null
    let dragStartX = 0
    let dragStartOffset = 0
    let moved = 0
    let lastDragX = 0
    let lastDragAt = 0
    let dragVelocity = 0

    /* One set plus the gap between the two: the point at which the duplicate
       set sits exactly where the first one started, so the wrap is invisible. */
    const loopWidth = () => {
      const set = track.querySelector<HTMLElement>('.industries-showcase-product-set')
      if (!set) return 0
      const gap = Number.parseFloat(getComputedStyle(track).columnGap || '0') || 0
      return set.getBoundingClientRect().width + gap
    }

    const cruise = () => {
      if (reduced.matches) return 0
      const seconds =
        Number.parseFloat(getComputedStyle(rail).getPropertyValue('--industry-product-duration')) ||
        20
      const width = loopWidth()
      return width > 0 ? width / seconds : 0
    }

    const draw = (now: number) => {
      frame = window.requestAnimationFrame(draw)
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0)
      last = now

      if (!dragging) {
        // Held still while hovered, focused, or off-screen; otherwise cruising.
        const target = hovering || !inView ? 0 : cruise()
        // Exponential approach: frame-rate independent, and it never overshoots.
        speed += (target - speed) * (1 - Math.exp(-dt / SPEED_TAU))
        offset += speed * dt
      }

      const width = loopWidth()
      if (width > 0) offset = ((offset % width) + width) % width
      track.style.transform = `translate3d(${-offset}px, 0, 0)`
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return
      dragging = true
      moved = 0
      pointerId = event.pointerId
      dragStartX = event.clientX
      dragStartOffset = offset
      lastDragX = event.clientX
      lastDragAt = event.timeStamp
      dragVelocity = 0
      rail.setPointerCapture(event.pointerId)
      rail.dataset.dragging = 'true'
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return
      const dx = event.clientX - dragStartX
      moved = Math.max(moved, Math.abs(dx))
      offset = dragStartOffset - dx

      const dt = (event.timeStamp - lastDragAt) / 1000
      if (dt > 0) {
        // px/s, sign matching `offset`, so it feeds straight back into `speed`.
        dragVelocity = -(event.clientX - lastDragX) / dt
        lastDragX = event.clientX
        lastDragAt = event.timeStamp
      }
    }

    const endDrag = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return
      dragging = false
      pointerId = null
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId)
      delete rail.dataset.dragging
      /* The throw carries on from the speed the pointer had, then damps back to
         whatever the rail should be doing -- cruise, or a stop if still hovered. */
      speed = Math.max(-4000, Math.min(4000, dragVelocity))
      if (moved > DRAG_THRESHOLD) rail.dataset.dragged = 'true'
    }

    // A drag that ends on a card must not follow its link.
    const onClickCapture = (event: MouseEvent) => {
      if (rail.dataset.dragged !== 'true') return
      delete rail.dataset.dragged
      event.preventDefault()
      event.stopPropagation()
    }

    const onEnter = () => {
      hovering = true
    }
    const onLeave = () => {
      hovering = false
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              inView = Boolean(entry?.isIntersecting)
              rail.dataset.inView = inView ? 'true' : 'false'
            },
            { threshold: 0.1 },
          )
    observer?.observe(rail)

    rail.addEventListener('pointerdown', onPointerDown)
    rail.addEventListener('pointermove', onPointerMove)
    rail.addEventListener('pointerup', endDrag)
    rail.addEventListener('pointercancel', endDrag)
    rail.addEventListener('click', onClickCapture, true)
    rail.addEventListener('pointerenter', onEnter)
    rail.addEventListener('pointerleave', onLeave)
    rail.addEventListener('focusin', onEnter)
    rail.addEventListener('focusout', onLeave)
    frame = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      rail.removeEventListener('pointerdown', onPointerDown)
      rail.removeEventListener('pointermove', onPointerMove)
      rail.removeEventListener('pointerup', endDrag)
      rail.removeEventListener('pointercancel', endDrag)
      rail.removeEventListener('click', onClickCapture, true)
      rail.removeEventListener('pointerenter', onEnter)
      rail.removeEventListener('pointerleave', onLeave)
      rail.removeEventListener('focusin', onEnter)
      rail.removeEventListener('focusout', onLeave)
      track.style.removeProperty('transform')
      delete rail.dataset.dragging
      delete rail.dataset.dragged
    }
  }, [moves])

  return (
    <div
      className="industries-showcase-product-grid"
      data-in-view={moves ? 'false' : undefined}
      data-moving={moves ? 'true' : undefined}
      id={anchorId}
      ref={railRef}
      style={style}
    >
      <div className="industries-showcase-product-track" ref={trackRef}>
        <div className="industries-showcase-product-set">
          <ProductCards ctaHref={ctaHref} products={products} />
        </div>
        {moves ? (
          <div aria-hidden="true" className="industries-showcase-product-set">
            <ProductCards ctaHref={ctaHref} duplicate products={products} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
