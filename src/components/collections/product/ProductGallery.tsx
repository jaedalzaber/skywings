'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'motion/react'
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { CubeIcon } from '@/components/atoms/icons'
import { MediaWireframe } from '@/components/atoms/MediaWireframe'

import type { ProductModel } from './viewer/types'

export type GalleryImage = { alt: string; url: string }

const mobileGalleryQuery = '(max-width: 47.999rem)'

function getMobileGallerySnapshot() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(mobileGalleryQuery).matches
}

function subscribeToMobileGallery(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined

  const mediaQuery = window.matchMedia(mobileGalleryQuery)
  mediaQuery.addEventListener('change', callback)

  return () => mediaQuery.removeEventListener('change', callback)
}

const Product3DViewer = dynamic(
  () => import('./Product3DViewer').then((mod) => ({ default: mod.Product3DViewer })),
  {
    loading: () => (
      <div className="pdp-viewer" aria-busy="true">
        <div className="pdp-viewer-loading">
          <span className="pdp-viewer-spinner" />
          Loading 3D viewer…
        </div>
      </div>
    ),
    ssr: false,
  },
)

function ChevronLeft() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  )
}

export function ProductGallery(props: {
  images: GalleryImage[]
  mobileImages?: GalleryImage[]
  model: ProductModel
  title: string
}) {
  const { images, mobileImages = [], model, title } = props
  const reduceMotion = useReducedMotion()
  const matchesMobileGallery = useSyncExternalStore(
    subscribeToMobileGallery,
    getMobileGallerySnapshot,
    () => false,
  )
  const [active, setActive] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ dragging: false, moved: false, startScroll: 0, startX: 0 })

  const useMobileImages = matchesMobileGallery && mobileImages.length > 0
  const activeImages = useMobileImages && mobileImages.length ? mobileImages : images
  const activeIndex = activeImages[active] ? active : 0
  const main = activeImages[activeIndex] ?? null
  const hasThumbs = activeImages.length > 1

  const scrollThumbIntoView = useCallback((index: number) => {
    const strip = stripRef.current
    const thumb = strip?.children[index] as HTMLElement | undefined
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [])

  const select = useCallback(
    (index: number) => {
      if (activeImages.length === 0) return
      const next = (index + activeImages.length) % activeImages.length
      setActive(next)
      scrollThumbIntoView(next)
    },
    [activeImages.length, scrollThumbIntoView],
  )

  // Wheel scrolls the strip horizontally (native listener so we can preventDefault).
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const onWheel = (event: WheelEvent) => {
      if (strip.scrollWidth <= strip.clientWidth) return
      event.preventDefault()
      strip.scrollLeft += event.deltaY + event.deltaX
    }
    strip.addEventListener('wheel', onWheel, { passive: false })
    return () => strip.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const strip = stripRef.current
    if (!strip) return
    drag.current = {
      dragging: true,
      moved: false,
      startScroll: strip.scrollLeft,
      startX: event.clientX,
    }
    strip.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.dragging || !stripRef.current) return
    const dx = event.clientX - drag.current.startX
    if (Math.abs(dx) > 4) drag.current.moved = true
    stripRef.current.scrollLeft = drag.current.startScroll - dx
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stripRef.current?.hasPointerCapture(event.pointerId)) {
      stripRef.current.releasePointerCapture(event.pointerId)
    }
    drag.current.dragging = false
  }

  return (
    <section aria-label={`${title} images`} className="pdp-hero">
      <div className="pdp-hero-media">
        {main ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="pdp-hero-frame"
            initial={reduceMotion ? false : { opacity: 0 }}
            key={main.url}
            transition={{ duration: 0.35 }}
          >
            <Image alt={main.alt} fill priority sizes="100vw" src={main.url} />
          </motion.div>
        ) : (
          <MediaWireframe label="product visual" />
        )}
      </div>

      <div className="pdp-hero-bar">
        <h1 className="pdp-hero-title">{title}</h1>

        <div className="pdp-hero-controls">
          <button className="pdp-3d-button" onClick={() => setViewerOpen(true)} type="button">
            <CubeIcon />
            <span>3D View</span>
          </button>

          {hasThumbs ? (
            <div className="pdp-hero-gallery">
              <button
                aria-label="Previous image"
                className="pdp-gallery-nav pdp-gallery-nav-prev"
                onClick={() => select(active - 1)}
                type="button"
              >
                <ChevronLeft />
              </button>

              <div
                className="pdp-hero-thumbs"
                onPointerCancel={endDrag}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                ref={stripRef}
              >
                {activeImages.map((image, index) => (
                  <button
                    aria-label={`Show view ${index + 1}`}
                    aria-current={index === activeIndex}
                    className="pdp-thumb"
                    data-active={index === activeIndex ? '' : undefined}
                    key={image.url + index}
                    onClick={() => {
                      if (drag.current.moved) return
                      select(index)
                    }}
                    type="button"
                  >
                    <Image alt={image.alt} fill sizes="8rem" src={image.url} />
                  </button>
                ))}
              </div>

              <button
                aria-label="Next image"
                className="pdp-gallery-nav pdp-gallery-nav-next"
                onClick={() => select(active + 1)}
                type="button"
              >
                <span className="pdp-nav-flip">
                  <ChevronLeft />
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {viewerOpen ? (
        <Product3DViewer model={model} onClose={() => setViewerOpen(false)} title={title} />
      ) : null}
    </section>
  )
}
