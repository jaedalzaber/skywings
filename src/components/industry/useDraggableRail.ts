'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The drag engine behind the industry page's rails.
 *
 * The track is a transform-driven GSAP Draggable rather than a native
 * scroller: that is what gives it momentum, edge resistance and snapping to
 * card edges from mouse, touch and trackpad alike. Buttons, horizontal wheel
 * and keyboard focus all move through the same snap points, so every input
 * agrees on where a "card" is.
 *
 * With `autoplayMs` the rail also advances on its own, returning to the start
 * when it reaches the end. It waits while the pointer is over it, while
 * anything inside has keyboard focus, while it is being dragged, while the
 * tab is in the background and while it is off screen -- so it never fights
 * the reader or burns battery in a hidden tab.
 *
 * Under a reduced-motion preference the rail still drags, without inertia,
 * and never moves by itself.
 */
export function useDraggableRail(options: {
  /** Autoplay interval in milliseconds; omit or 0 to stay still. */
  autoplayMs?: number
  /** How many items there are: the rail re-measures when this changes. */
  count: number
  /** Selects one card inside the track. */
  itemSelector: string
  /** Changing this re-runs the setup, e.g. when a filter swaps the cards. */
  resetKey?: string
}) {
  const { autoplayMs = 0, count, itemSelector, resetKey } = options
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const stepRef = useRef<((direction: -1 | 1) => void) | null>(null)
  const [edges, setEdges] = useState({ atEnd: false, atStart: true })
  /** How far along the rail is, 0 to 1, for the progress bar. */
  const [progress, setProgress] = useState(0)

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
        setProgress(minX < 0 ? Math.min(1, Math.max(0, x / minX)) : 0)
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
        onPress: () => pause('drag'),
        onRelease: () => resume('drag'),
        onThrowUpdate: updateEdges,
        snap: reducedMotion ? undefined : { x: nearest },
        type: 'x',
        zIndexBoost: false,
      })

      const measure = () => {
        const items = [...track.querySelectorAll<HTMLElement>(itemSelector)]
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

      const step = (direction: -1 | 1) => {
        const x = currentX()
        const target =
          direction > 0
            ? (snapPoints.find((point) => point < x - 1) ?? minX)
            : ([...snapPoints].reverse().find((point) => point > x + 1) ?? 0)
        goTo(target)
      }
      stepRef.current = step

      /*
       * Autoplay. Reasons to wait are held in a set rather than one flag, so
       * a pointer leaving does not restart a rail that is also off screen.
       */
      const holds = new Set<string>()
      let timer: number | undefined
      const canAutoplay = autoplayMs > 0 && !reducedMotion

      const tick = () => {
        if (!active || holds.size > 0) return
        // At the end, back to the beginning rather than stopping for good.
        if (currentX() <= minX + 1) goTo(0, 0.9)
        else step(1)
        schedule()
      }
      const schedule = () => {
        if (!canAutoplay) return
        window.clearTimeout(timer)
        timer = window.setTimeout(tick, autoplayMs)
      }
      const pause = (reason: string) => {
        holds.add(reason)
        window.clearTimeout(timer)
      }
      const resume = (reason: string) => {
        holds.delete(reason)
        if (holds.size === 0) schedule()
      }

      const onEnter = () => pause('pointer')
      const onLeave = () => resume('pointer')
      const onFocusIn = () => pause('focus')
      const onFocusOut = () => resume('focus')
      const onVisibility = () => (document.hidden ? pause('hidden') : resume('hidden'))

      // Trackpad / shift+wheel horizontal scrolling.
      const onWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
        event.preventDefault()
        goTo(currentX() - event.deltaX, 0.35)
        schedule()
      }

      /*
       * Keyboard users tabbing through card links get the card brought into
       * view. Pointer presses also focus the link, so only keyboard focus
       * (`:focus-visible`) counts -- otherwise the first drag on a card would
       * be fighting a tween back to that card's resting position.
       */
      const onFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement
        const item = target.closest<HTMLElement>(itemSelector)
        if (!item || drag.isPressed || drag.isDragging || !target.matches(':focus-visible')) return
        const padLeft = parseFloat(getComputedStyle(track).paddingLeft) || 0
        goTo(-(item.offsetLeft - padLeft))
      }

      const observer = new ResizeObserver(() => {
        measure()
        goTo(nearest(currentX()), 0.3)
      })
      const seen = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? resume('offscreen') : pause('offscreen')),
        { threshold: 0.2 },
      )

      measure()
      updateEdges()
      observer.observe(viewport)
      viewport.addEventListener('wheel', onWheel, { passive: false })
      track.addEventListener('focusin', onFocus)

      if (canAutoplay) {
        seen.observe(viewport)
        viewport.addEventListener('mouseenter', onEnter)
        viewport.addEventListener('mouseleave', onLeave)
        viewport.addEventListener('focusin', onFocusIn)
        viewport.addEventListener('focusout', onFocusOut)
        document.addEventListener('visibilitychange', onVisibility)
        // Starts held: the IntersectionObserver releases it once on screen.
        pause('offscreen')
      }

      cleanup = () => {
        window.clearTimeout(timer)
        observer.disconnect()
        seen.disconnect()
        viewport.removeEventListener('wheel', onWheel)
        viewport.removeEventListener('mouseenter', onEnter)
        viewport.removeEventListener('mouseleave', onLeave)
        viewport.removeEventListener('focusin', onFocusIn)
        viewport.removeEventListener('focusout', onFocusOut)
        document.removeEventListener('visibilitychange', onVisibility)
        track.removeEventListener('focusin', onFocus)
        track.removeEventListener('dragstart', onDragStart)
        drag.kill()
        gsap.killTweensOf(track)
        gsap.set(track, { clearProps: 'transform,cursor,touchAction,userSelect' })
        stepRef.current = null
      }
    }

    void setup()

    return () => {
      active = false
      cleanup?.()
    }
  }, [autoplayMs, count, itemSelector, resetKey])

  return {
    edges,
    progress,
    step: (direction: -1 | 1) => stepRef.current?.(direction),
    trackRef,
    viewportRef,
  }
}
