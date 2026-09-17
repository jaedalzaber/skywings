'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'

/**
 * The call to action's backdrop: an industry photograph that drifts against
 * the page as the section passes, behind the brand blue.
 *
 * The picture is taller than the section and moves within it, so the parallax
 * never uncovers an edge. `background-attachment: fixed` would be one line,
 * but it is not composited on iOS and judders on every other touch device;
 * a transform driven by the section's own scroll progress is smooth
 * everywhere. Under a reduced-motion preference it simply sits still.
 */
export function CtaParallax(props: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    target: ref,
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <div aria-hidden="true" className="industry-cta-backdrop" ref={ref}>
      <motion.div className="industry-cta-backdrop-layer" style={reduced ? undefined : { y }}>
        {props.children}
      </motion.div>
    </div>
  )
}
