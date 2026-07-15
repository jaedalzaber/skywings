'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { HomeProcessLayoutBlock } from '@/data/home'

import { HomeProcessModel } from './HomeProcessModel'

const processFallbacks = [
  {
    title: 'Client Brief',
    description:
      'We define the requirement, application, constraints, and delivery target before production begins.',
  },
  {
    title: 'Mechanical CAD Design',
    description:
      'Our engineers translate the brief into accurate, production-ready drawings and assemblies.',
  },
  {
    title: 'Laser Cutting & Machining',
    description:
      'Components are cut and machined to controlled tolerances using the right production process.',
  },
  {
    title: 'Welding & Erection',
    description:
      'Parts are aligned, welded, and assembled into a strong, dependable finished structure.',
  },
  {
    title: 'Surface Painting & Finishings',
    description:
      'Protective coatings and final finishes are applied for durability, safety, and presentation.',
  },
  {
    title: 'Final Delivery',
    description:
      'The completed product is inspected, documented, and prepared for safe delivery to site.',
  },
]

const cycleDuration = 4000

export function HomeProcessSection({ block }: { block: HomeProcessLayoutBlock }) {
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const steps = useMemo(
    () =>
      processFallbacks.map((fallback, index) => ({
        ...fallback,
        title: block.steps[index]?.title || fallback.title,
      })),
    [block.steps],
  )

  useEffect(() => {
    if (hoveredIndex !== null) return

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % steps.length)
    }, cycleDuration)

    return () => clearInterval(timer)
  }, [hoveredIndex, steps.length])

  useEffect(() => {
    const section = sectionRef.current

    if (!section || reduceMotion || typeof window.matchMedia !== 'function') {
      return
    }

    let mounted = true
    let trigger: { kill: () => void } | undefined
    const root = document.documentElement

    const setNavigationState = (active: boolean) => {
      if (active) {
        root.dataset.processNavActive = 'true'
      } else {
        delete root.dataset.processNavActive
      }
    }

    async function setupPin() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      if (!mounted) return

      gsap.registerPlugin(ScrollTrigger)
      trigger = ScrollTrigger.create({
        anticipatePin: 1,
        end: () => `+=${window.innerHeight * 0.1}`,
        invalidateOnRefresh: true,
        onEnter: () => setNavigationState(true),
        onEnterBack: () => setNavigationState(true),
        onLeave: () => setNavigationState(false),
        onLeaveBack: () => setNavigationState(false),
        pin: true,
        start: 'top top',
        trigger: section,
      })
      ScrollTrigger.refresh()
    }

    void setupPin()

    return () => {
      mounted = false
      trigger?.kill()
      setNavigationState(false)
    }
  }, [reduceMotion])

  const activateStep = (index: number) => {
    setHoveredIndex(index)
    setActiveIndex(index)
  }

  const renderStep = (
    step: (typeof steps)[number],
    index: number,
    columnHasActiveStep: boolean,
  ) => {
    const isActive = activeIndex === index
    const fillsCollapsedColumn = !columnHasActiveStep

    return (
      <motion.article
        animate={{ flexGrow: isActive || fillsCollapsedColumn ? 1 : 0 }}
        className="process-step"
        data-active={isActive}
        data-fill-column={fillsCollapsedColumn}
        key={step.title}
        layout
        transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          aria-expanded={isActive}
          aria-label={`Process step ${index + 1}: ${step.title}`}
          className="process-step-trigger"
          onBlur={() => setHoveredIndex(null)}
          onFocus={() => activateStep(index)}
          onMouseEnter={() => activateStep(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          type="button"
        >
          <AnimatePresence initial={false}>
            {isActive ? (
              <motion.span
                animate={{ opacity: 1, y: 0 }}
                className="process-step-visual"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="visual"
                transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.18 }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </motion.span>
            ) : null}
          </AnimatePresence>

          <motion.span
            className="process-step-copy"
            layout="position"
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.strong
                animate={{ opacity: 1, y: 0 }}
                className="process-step-title"
                data-title-state={isActive ? 'expanded' : 'collapsed'}
                data-title-transition="fade"
                exit={{ opacity: 0, y: isActive ? 5 : -5 }}
                initial={{ opacity: 0, y: isActive ? -5 : 5 }}
                key={isActive ? 'expanded-title' : 'collapsed-title'}
                transition={{ duration: reduceMotion ? 0 : 0.32, ease: 'easeOut' }}
              >
                {index + 1}. {step.title}
              </motion.strong>
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {isActive ? (
                <motion.span
                  animate={{ opacity: 1, y: 0 }}
                  className="process-step-description"
                  exit={{ opacity: 0, y: 8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key="description"
                  transition={{ duration: reduceMotion ? 0 : 0.3, delay: reduceMotion ? 0 : 0.22 }}
                >
                  {step.description}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.span>
        </button>
      </motion.article>
    )
  }

  const leftColumnHasActiveStep = activeIndex < 3
  const rightColumnHasActiveStep = activeIndex >= 3

  return (
    <section
      aria-labelledby="manufacturing-process-title"
      className="manufacturing-process"
      data-nav-surface="white"
      data-scroll-scene="pinned"
      id="manufacturing-process"
      ref={sectionRef}
    >
      <header className="process-header" data-grid-alignment="process-columns">
        <h2 id="manufacturing-process-title">Our Manufacturing Process</h2>
        <div className="process-specs" aria-label="Example product specifications">
          <span>// GSE Luggage Trolley</span>
          <span>// 1500 Kg Capacity</span>
        </div>
        <div className="process-mark" data-position="top-right" aria-hidden="true">
          <span>SW</span>
        </div>
      </header>

      <div className="process-grid">
        <div
          className="process-column process-column-left"
          data-has-active-step={leftColumnHasActiveStep}
        >
          {steps.slice(0, 3).map((step, index) => renderStep(step, index, leftColumnHasActiveStep))}
        </div>
        <div
          className="process-model-stage"
          data-testid="process-model-stage"
          aria-label="Rotating product wireframe"
        >
          <HomeProcessModel />
        </div>
        <div
          className="process-column process-column-right"
          data-has-active-step={rightColumnHasActiveStep}
        >
          {steps
            .slice(3)
            .map((step, index) => renderStep(step, index + 3, rightColumnHasActiveStep))}
        </div>
      </div>
    </section>
  )
}
