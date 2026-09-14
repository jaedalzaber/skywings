'use client'

import { LazyMotion, domAnimation, m, type Variants } from 'motion/react'
import { Fragment, type ComponentPropsWithRef, type ReactNode } from 'react'

/**
 * The home page's entrance motion, in one place.
 *
 * Every band is meant to arrive the same way: parts settle up into position
 * as they come into view, once, and never again. Keeping the timings and the
 * easing here is what stops six sections from each inventing their own
 * personality -- and it means the whole page can be retuned from one file.
 *
 * These components render the element they are given rather than wrapping it,
 * so `<Reveal as="header" className="machining-head">` produces exactly the
 * `<header class="machining-head">` the stylesheet expects. Nothing about the
 * layout changes; only how it arrives.
 *
 * The scroll-scrubbed scene (the process accordion) stays on GSAP: it follows
 * the scrollbar frame by frame, which is a different job from a one-shot
 * reveal and does not belong in the same abstraction.
 *
 * A reduced-motion preference is honoured in the stylesheet rather than here,
 * by a rule that pins anything marked `data-reveal` to its resting state.
 * That was a deliberate move away from branching on useReducedMotion: the
 * hook reports nothing on the server and on the first client render, so the
 * hidden first frame shipped in the HTML either way, and switching element
 * type once it resolved remounted the subtree and stranded that frame on
 * screen. A stylesheet rule cannot be raced.
 */

/**
 * Quick to leave, slow to arrive -- the way a machined part slides home. Used
 * for every variant, so the page reads as one hand.
 */
const EASE = [0.22, 0.61, 0.36, 1] as const

export type RevealMotion = 'rise' | 'fade' | 'line' | 'shutter' | 'word'

const VARIANTS: Record<RevealMotion, Variants> = {
  /** The default: a short lift, no further than a line of text. */
  rise: {
    hidden: { opacity: 0, y: 18 },
    shown: { opacity: 1, transition: { duration: 0.62, ease: EASE }, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1, transition: { duration: 0.55, ease: EASE } },
  },
  /**
   * A word of a headline lifting into place. The distance is in em so it
   * tracks the type size -- the same code reads right on a hero and on a
   * sub-heading -- and a set of these, staggered, is what makes a line arrive
   * as words rather than as one block.
   */
  word: {
    hidden: { opacity: 0, y: '0.42em' },
    shown: { opacity: 1, transition: { duration: 0.7, ease: EASE }, y: '0em' },
  },
  /** A rule drawing itself out from its left end. */
  line: {
    hidden: { opacity: 1, scaleX: 0 },
    shown: { opacity: 1, scaleX: 1, transition: { duration: 0.72, ease: EASE } },
  },
  /**
   * A picture uncovered from the bottom edge up, easing off a slight
   * over-scale -- a shutter opening rather than a photograph fading in.
   */
  shutter: {
    hidden: { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.04 },
    shown: {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1,
      transition: { duration: 0.9, ease: EASE },
    },
  },
}

/*
 * `m` is a proxy that mints one component per tag on first access. Resolving
 * them here, once, rather than per render is what keeps each component
 * identity stable -- looking one up mid-render would remount its subtree, and
 * for a card that means its image reloading every time its parent renders.
 *
 * The cast is contained to this line: the proxy's per-tag types are a union
 * JSX cannot spread arbitrary props into, and `Tag` below keeps the set
 * honest about which tags actually exist.
 */
type AnyMotionComponent = (props: Record<string, unknown>) => ReactNode

const MOTION_TAGS = {
  article: m.article,
  button: m.button,
  div: m.div,
  dl: m.dl,
  figure: m.figure,
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  header: m.header,
  li: m.li,
  p: m.p,
  section: m.section,
  span: m.span,
  ul: m.ul,
}

/** Every key is an intrinsic tag, so element props stay fully typed. */
type Tag = keyof typeof MOTION_TAGS

/* Refs come through: the bar's menu button is focused again when its drawer
   closes, and a reveal must not be what takes that away. */
type BaseProps<T extends Tag> = Omit<ComponentPropsWithRef<T>, 'children'> & {
  as?: T
  children?: ReactNode
  /** Which of the shared variants to arrive with. Defaults to `rise`. */
  motion?: RevealMotion
}

type RevealProps<T extends Tag> = BaseProps<T> & {
  /** Seconds to hold before starting, for hand-placing one part after another. */
  delay?: number
  /** How much of the element must be in view before it starts. */
  amount?: number
}

function variantsFor(motion: RevealMotion, delay: number): Variants {
  if (!delay) return VARIANTS[motion]

  const shown = VARIANTS[motion].shown as Record<string, unknown>
  const transition = shown.transition as Record<string, unknown>

  return {
    ...VARIANTS[motion],
    shown: { ...shown, transition: { ...transition, delay } },
  }
}

/** `line` scales from its left end, so the rule draws rather than stretches. */
const originStyle = (motion: RevealMotion) =>
  motion === 'line' ? ({ transformOrigin: 'left center' } as const) : undefined

/**
 * One element that arrives on its own as it scrolls into view. For a set of
 * parts that should arrive in sequence, use `RevealGroup` with `RevealItem`.
 */
export function Reveal<T extends Tag = 'div'>(props: RevealProps<T>) {
  const { amount = 0.25, as, children, delay = 0, motion = 'rise', style, ...rest } = props
  const tag = (as ?? 'div') as Tag
  const Component = MOTION_TAGS[tag] as unknown as AnyMotionComponent

  return (
    <LazyMotion features={domAnimation} strict>
      <Component
        {...rest}
        data-reveal=""
        initial="hidden"
        style={{ ...originStyle(motion), ...(style as object) }}
        variants={variantsFor(motion, delay)}
        viewport={{ amount, once: true }}
        whileInView="shown"
      >
        {children}
      </Component>
    </LazyMotion>
  )
}

type GroupProps<T extends Tag> = Omit<BaseProps<T>, 'motion'> & {
  amount?: number
  /** Seconds before the first child starts. */
  delay?: number
  /** Seconds between one child and the next. */
  stagger?: number
}

/**
 * A container whose `RevealItem` children arrive one after another. The
 * children inherit the container's state, so the whole set is driven by one
 * observer -- the stagger holds however the copy is later reordered.
 */
export function RevealGroup<T extends Tag = 'div'>(props: GroupProps<T>) {
  const { amount = 0.2, as, children, delay = 0.04, stagger = 0.08, ...rest } = props
  const tag = (as ?? 'div') as Tag
  const Component = MOTION_TAGS[tag] as unknown as AnyMotionComponent

  return (
    <LazyMotion features={domAnimation} strict>
      <Component
        {...rest}
        data-reveal=""
        initial="hidden"
        variants={{
          hidden: {},
          shown: { transition: { delayChildren: delay, staggerChildren: stagger } },
        }}
        viewport={{ amount, once: true }}
        whileInView="shown"
      >
        {children}
      </Component>
    </LazyMotion>
  )
}

/**
 * An acronym: two or more letters, all of them capital, whatever punctuation
 * is holding on to it. Marked so a headline can set its own initialisms --
 * UAE, GSE -- apart from the words around them, which a stylesheet alone
 * cannot do: there is no selecting one word of a sentence in CSS.
 */
const ACRONYM = /^[^\p{L}\p{N}]*\p{Lu}{2,}[^\p{L}\p{N}]*$/u

/**
 * Splits a line of copy so its words arrive one after another, as part of a
 * surrounding `RevealGroup`.
 *
 * The words stay real text with real spaces between them, so the heading's
 * accessible name is unchanged -- a headline is the last thing on a page that
 * should be traded away for an effect. Transforms do not apply to inline
 * boxes, so `.reveal-word` makes each one inline-block in the stylesheet.
 */
export function RevealWords(props: { text: string }) {
  const words = props.text.split(/\s+/).filter(Boolean)

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          {index > 0 ? ' ' : null}
          <RevealItem
            as="span"
            className={ACRONYM.test(word) ? 'reveal-word reveal-word--acronym' : 'reveal-word'}
            motion="word"
          >
            {word}
          </RevealItem>
        </Fragment>
      ))}
    </>
  )
}

/**
 * A part of a `RevealGroup`. It carries no observer of its own: its turn comes
 * from the container, which is what keeps the sequence in order.
 */
export function RevealItem<T extends Tag = 'div'>(props: BaseProps<T>) {
  const { as, children, motion = 'rise', style, ...rest } = props
  const tag = (as ?? 'div') as Tag
  const Component = MOTION_TAGS[tag] as unknown as AnyMotionComponent

  return (
    <Component
      {...rest}
      data-reveal=""
      style={{ ...originStyle(motion), ...(style as object) }}
      variants={VARIANTS[motion]}
    >
      {children}
    </Component>
  )
}
