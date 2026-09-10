'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Scroll-driven reveal primitives shared by every industry section.
 *
 * Built on Motion's `whileInView` so each element animates the first time it
 * scrolls into the viewport and then stays put. Under `prefers-reduced-motion`
 * every variant collapses to "visible", so nothing moves and nothing is hidden.
 */

export type RevealEffect = 'clip' | 'fade' | 'left' | 'right' | 'scale' | 'up'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Trigger as soon as a sliver of the element clears the bottom edge. A larger
 * threshold looked broken on tall screens: content sitting just inside the
 * viewport on load stayed invisible until the visitor scrolled.
 */
export const REVEAL_VIEWPORT = { amount: 0.05, margin: '0px 0px -3% 0px', once: true } as const

export function revealVariants(
  effect: RevealEffect,
  reduced: boolean,
  duration = 0.9,
  delay = 0,
): Variants {
  if (reduced) {
    return { hidden: { opacity: 1 }, visible: { opacity: 1 } }
  }

  const transition = { delay, duration, ease: EASE }

  switch (effect) {
    case 'fade':
      return { hidden: { opacity: 0 }, visible: { opacity: 1, transition } }
    case 'clip':
      return {
        hidden: { clipPath: 'inset(0 0 100% 0)', y: 32 },
        visible: {
          clipPath: 'inset(0 0 0% 0)',
          transition: { ...transition, duration: duration + 0.25 },
          y: 0,
        },
      }
    case 'scale':
      return {
        hidden: { opacity: 0, scale: 0.92, y: 24 },
        visible: { opacity: 1, scale: 1, transition, y: 0 },
      }
    case 'left':
      return { hidden: { opacity: 0, x: -48 }, visible: { opacity: 1, transition, x: 0 } }
    case 'right':
      return { hidden: { opacity: 0, x: 48 }, visible: { opacity: 1, transition, x: 0 } }
    default:
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, transition, y: 0 } }
  }
}

export function groupVariants(reduced: boolean, stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: reduced ? {} : { delayChildren, staggerChildren: stagger } },
  }
}

const tags = {
  div: motion.div,
  figure: motion.figure,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  li: motion.li,
  p: motion.p,
  span: motion.span,
  ul: motion.ul,
} as const

export type RevealTag = keyof typeof tags

type CommonProps = {
  as?: RevealTag
  children: ReactNode
  className?: string
  /**
   * Play on mount instead of waiting to scroll into view. For content that
   * is already on screen when the page loads (the intro under the hero), so
   * it joins the entrance sequence rather than waiting for a scroll.
   */
  eager?: boolean
  id?: string
  style?: CSSProperties
}

function triggerProps(eager: boolean | undefined) {
  return eager
    ? ({ animate: 'visible' } as const)
    : ({ viewport: REVEAL_VIEWPORT, whileInView: 'visible' } as const)
}

/**
 * Single element that reveals itself when scrolled into view.
 *
 * The clip effect animates an inner layer rather than the observed element:
 * browsers apply an element's own `clip-path` when measuring intersection,
 * so a box clipped to nothing would never count as visible and never open.
 */
export function Reveal(
  props: CommonProps & { delay?: number; duration?: number; effect?: RevealEffect },
) {
  const { as = 'div', children, className, delay, duration, eager, effect = 'up', id, style } =
    props
  const reduced = useReducedMotion() ?? false
  const Component = tags[as] as typeof motion.div

  if (effect === 'clip') {
    return (
      <Component
        className={className}
        id={id}
        initial="hidden"
        style={style}
        variants={groupVariants(reduced, 0, delay)}
        {...triggerProps(eager)}
      >
        <motion.div
          className="industry-reveal-clip"
          variants={revealVariants('clip', reduced, duration)}
        >
          {children}
        </motion.div>
      </Component>
    )
  }

  return (
    <Component
      className={className}
      id={id}
      initial="hidden"
      style={style}
      variants={revealVariants(effect, reduced, duration, delay)}
      {...triggerProps(eager)}
    >
      {children}
    </Component>
  )
}

/** Container whose `RevealItem` children stagger in together. */
export function RevealGroup(props: CommonProps & { delayChildren?: number; stagger?: number }) {
  const { as = 'div', children, className, delayChildren, eager, id, stagger, style } = props
  const reduced = useReducedMotion() ?? false
  const Component = tags[as] as typeof motion.div

  return (
    <Component
      className={className}
      id={id}
      initial="hidden"
      style={style}
      variants={groupVariants(reduced, stagger, delayChildren)}
      {...triggerProps(eager)}
    >
      {children}
    </Component>
  )
}

/** Child of a `RevealGroup`; inherits the group's trigger and stagger. */
export function RevealItem(props: CommonProps & { duration?: number; effect?: RevealEffect }) {
  const { as = 'div', children, className, duration, effect = 'up', id, style } = props
  const reduced = useReducedMotion() ?? false
  const Component = tags[as] as typeof motion.div

  return (
    <Component
      className={className}
      id={id}
      style={style}
      variants={revealVariants(effect, reduced, duration)}
    >
      {children}
    </Component>
  )
}
