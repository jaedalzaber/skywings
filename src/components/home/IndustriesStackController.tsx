'use client'

import { useEffect } from 'react'

/*
 * The industry cards are sticky siblings: each pins a peek-height lower than
 * the last, so they collect into a stack of title strips. What stays visible of
 * a card is the gap between its own top and the next card's top.
 *
 * That measurement is published back to CSS as --industries-visible, in pixels,
 * because the collapse is continuous: the strip shrinks smoothly as the next
 * card rises, and the hero image sized from it shrinks with it. A boolean
 * "collapsed" flag can only snap between two heights, which reads as the image
 * jumping. data-collapsed is still set, but only for the states that genuinely
 * are binary -- hiding the CTA once a card is no longer the open one.
 */

/**
 * Hysteresis for that flag, in pixels of the card's own height. A card counts
 * as collapsed once it has lost COLLAPSE_ENTER, and as open again only when it
 * is back within COLLAPSE_EXIT; the gap between the two is what stops the flag
 * flipping every frame while a card sits on the boundary.
 */
const COLLAPSE_ENTER = 6
const COLLAPSE_EXIT = 1

/**
 * How much of the viewport a card takes to fade its contents up, as a fraction
 * of the viewport height. Its top starts the run at the foot of the screen and
 * finishes it this far above -- well before the card is doing any covering, so
 * what is printed on it has settled by the time it reaches the card beneath.
 */
const ENTER_SPAN = 0.45

/**
 * The shape of that run. The distance travelled is linear, but opacity is this
 * power of it, which is what decides how white the card looks on the way in: a
 * straight ramp is already half readable at the half-way point, so the card
 * arrived looking greyed rather than blank. Raising this holds it near white
 * for most of the run and brings the content up over the last of it -- 1 is the
 * straight ramp, 2 is gentle, 3 or 4 keep it blank until noticeably later.
 */
const ENTER_EASE = 3

export function IndustriesStackController() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-responsive-layout="industries"]')
    if (!section) return

    const cards = Array.from(section.querySelectorAll<HTMLElement>('.industries-showcase-card'))
    if (cards.length < 2) return

    /*
     * The cards pin directly under the sticky header, so the offset is the
     * header's height -- measured rather than hard-coded, because the bar
     * condenses as the page scrolls (80px at rest, 56px once away from the
     * top). A fixed offset leaves exactly that difference as dead white space
     * above the stack once the header shrinks, which is why this is re-read on
     * every scroll frame rather than only on load and resize.
     */
    /*
     * The header's height is not measured here. It has exactly two states, both
     * expressed in CSS off html[data-nav-stuck], and --header-height carries
     * them -- see the token beside .topbar in styles.css. Measuring it from JS
     * lagged the bar: the condense is a transition that finishes after the last
     * scroll event, so the reading was taken mid-animation and never corrected,
     * leaving a band of white under the bar.
     */

    /*
     * The fade is the one piece of motion here, so it is the one piece that a
     * reduced-motion preference drops. Without the property the stylesheet's
     * own fallback of 1 applies, which is also what a page with no JS gets.
     */
    const fades = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let frame = 0

    const sync = () => {
      frame = 0
      const tops = cards.map((card) => card.getBoundingClientRect().top)
      const view = window.innerHeight

      for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i]
        const full = card.offsetHeight
        // The last card is never covered, so it is always fully visible.
        const visible = i === cards.length - 1 ? full : Math.min(full, tops[i + 1] - tops[i])
        const clamped = Math.max(0, Math.round(visible))

        card.style.setProperty('--industries-visible', `${clamped}px`)

        /*
         * How far the card has risen into view, 0 to 1, published for the
         * content fade. Nothing here touches the card's own opacity: a card
         * that went transparent would show the one it is covering straight
         * through, and the fade is meant to do the opposite -- the white
         * arrives solid and only what is printed on it comes up.
         */
        if (fades) {
          const entered = (view - tops[i]) / (view * ENTER_SPAN)
          const travelled = Math.min(1, Math.max(0, entered))
          const progress = travelled ** ENTER_EASE
          card.style.setProperty('--industries-enter', progress.toFixed(3))

          /*
           * The blur reads the same progress, so it can only resolve in step
           * with the fade. It is mounted by this flag rather than left on at
           * blur(0) once settled: any filter but `none` holds a compositing
           * layer and a stacking context open, and leaving one on the contents
           * of every card would be paying for the arrival for the whole page.
           *
           * No hysteresis needed here, unlike the collapse flag below -- both
           * sides of this threshold render identically, so a card sitting on it
           * has nothing to show for the flag changing.
           */
          if (progress < 1) card.setAttribute('data-entering', 'true')
          else card.removeAttribute('data-entering')
        }

        /*
         * Two thresholds, not one. A single 1px line sat right where `visible`
         * settles when a card is all but covered, so sub-pixel scrolling
         * flipped the flag on and off between frames and the CTA blinked. A
         * card has to lose ENTER px before it counts as collapsed and be back
         * within EXIT px to count as open again, which puts a dead band
         * between the two and gives the flag nothing to chatter across.
         */
        const collapsed = card.getAttribute('data-collapsed') === 'true'
        const threshold = collapsed ? COLLAPSE_EXIT : COLLAPSE_ENTER
        if (clamped < full - threshold) card.setAttribute('data-collapsed', 'true')
        else card.removeAttribute('data-collapsed')
      }
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(sync)
    }

    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      for (const card of cards) {
        card.style.removeProperty('--industries-visible')
        card.style.removeProperty('--industries-enter')
        card.removeAttribute('data-collapsed')
        card.removeAttribute('data-entering')
      }
    }
  }, [])

  return null
}
