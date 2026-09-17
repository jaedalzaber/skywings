'use client'

import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Fragment, useRef, type ReactNode } from 'react'

import { REVEAL_VIEWPORT } from './Reveal'

type Segment = {
  breakAfter?: boolean | null
  emphasis?: string | null
  id?: string | null
  text: string
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The value heading, raised word by word out of line masks as it scrolls in,
 * with the emphasised words in the same sequence so the statement reads in
 * the order it is written. The text is ordinary heading text throughout --
 * the masks are presentation only -- so screen readers and search read the
 * sentence whole.
 */
export function ValueHeading(props: { className: string; id: string; segments: Segment[] }) {
  const reduced = useReducedMotion() ?? false
  let index = 0

  return (
    <motion.h2
      className={props.className}
      id={props.id}
      initial="hidden"
      viewport={REVEAL_VIEWPORT}
      whileInView="visible"
    >
      {props.segments.map((segment, segmentIndex) => {
        const words = segment.text.split(/\s+/).filter(Boolean)
        const content = words.map((word, wordIndex) => {
          const order = index++
          return (
            // The space sits outside the word's inline-block: inside it, the
            // browser trims it as trailing whitespace and the words run together.
            <Fragment key={`${word}-${wordIndex}`}>
              <span className="industry-value-word">
                <motion.span
                  className="industry-value-word-inner"
                  transition={{ delay: reduced ? 0 : 0.08 + order * 0.06, duration: reduced ? 0 : 0.85, ease: EASE }}
                  variants={{
                    hidden: reduced ? { y: 0 } : { y: '110%' },
                    visible: { y: 0 },
                  }}
                >
                  {word}
                </motion.span>
              </span>{' '}
            </Fragment>
          )
        })

        return (
          <span key={segment.id ?? `${segment.text}-${segmentIndex}`}>
            {segment.emphasis === 'bold' ? <strong>{content}</strong> : content}
            {segment.breakAfter ? <br /> : null}
          </span>
        )
      })}
      <motion.span
        aria-hidden="true"
        className="industry-value-rule"
        transition={{ delay: reduced ? 0 : 0.2 + index * 0.06, duration: reduced ? 0 : 1, ease: EASE }}
        variants={{ hidden: { scaleX: reduced ? 1 : 0 }, visible: { scaleX: 1 } }}
      />
    </motion.h2>
  )
}

/**
 * The description and its points. Marks itself `data-in-view` once it
 * scrolls in, and the stylesheet sequences the rest -- paragraph, then each
 * point with its marker drawing across -- so rich text from the admin
 * animates without the editor having to structure anything.
 */
export function ValueCopy(props: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2, once: true })

  return (
    <div className="industry-value-body" data-in-view={inView ? 'true' : 'false'} ref={ref}>
      {props.children}
    </div>
  )
}

/**
 * The feature photograph: uncovered from the top as it arrives, then drifting
 * gently against the page while the band scrolls past. The picture is scaled
 * up inside its frame so the drift never shows an edge.
 *
 * The clip is on an inner layer, not on the figure that is watched for view:
 * browsers apply an element's own `clip-path` when measuring intersection, so
 * a figure clipped to nothing reported 0% visible, never reached the reveal
 * threshold, and the photograph never appeared.
 */
export function ValueMedia(props: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ offset: ['start end', 'end start'], target: ref })
  const y = useTransform(scrollYProgress, [0, 1], ['-7%', '7%'])

  return (
    <motion.figure
      className="industry-value-media"
      initial="hidden"
      ref={ref}
      viewport={REVEAL_VIEWPORT}
      whileInView="visible"
    >
      <motion.div
        className="industry-value-media-clip"
        transition={{ duration: reduced ? 0 : 1.2, ease: EASE }}
        variants={
          reduced
            ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
            : {
                // No 'round' here: the animation cannot interpolate it and left the
                // picture fully clipped. The frame's own radius rounds the corners.
                hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
                visible: { clipPath: 'inset(0% 0% 0% 0%)' },
              }
        }
      >
        <motion.div className="industry-value-media-layer" style={reduced ? undefined : { y }}>
          {props.children}
        </motion.div>
      </motion.div>
    </motion.figure>
  )
}
