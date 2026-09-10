'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'

import { MinusIcon, PlusIcon } from '@/components/atoms/icons'
import { RichText } from '@/components/atoms/RichText'

import { groupVariants, REVEAL_VIEWPORT, revealVariants } from './Reveal'

export type FaqItem = {
  answer: Parameters<typeof RichText>[0]['value']
  category: null | string
  defaultOpen: boolean
  id: string
  question: string
}

export type FaqGroup = {
  id: string
  items: FaqItem[]
  label: null | string
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Controlled accordion. Open state lives in React (not `<details open>`)
 * because React 19 hydration resets uncontrolled details elements, and
 * because "one open at a time" needs a single source of truth anyway.
 * Answers slide open and closed; items stagger in on first scroll.
 */
export function FaqAccordion(props: { allowMultipleOpen: boolean; groups: FaqGroup[] }) {
  const { allowMultipleOpen, groups } = props
  const baseId = useId()
  const reduced = useReducedMotion() ?? false
  const [open, setOpen] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    groups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.defaultOpen && (allowMultipleOpen || initial.size === 0)) {
          initial.add(item.id)
        }
      }),
    )
    return initial
  })

  const toggle = (id: string) => {
    setOpen((current) => {
      const next = allowMultipleOpen ? new Set(current) : new Set<string>()
      if (current.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expand = reduced
    ? { animate: { height: 'auto', opacity: 1 }, exit: { height: 'auto', opacity: 1 } }
    : { animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } }

  return (
    <div className="industry-faq-groups">
      {groups.map((group) => (
        <motion.div
          className="industry-faq-group"
          initial="hidden"
          key={group.id}
          variants={groupVariants(reduced, 0.08)}
          viewport={REVEAL_VIEWPORT}
          whileInView="visible"
        >
          {group.label ? (
            <motion.h3
              className="industry-faq-group-label"
              variants={revealVariants('fade', reduced, 0.6)}
            >
              {group.label}
            </motion.h3>
          ) : null}

          <div className="industry-faq-list">
            {group.items.map((item) => {
              const isOpen = open.has(item.id)
              const panelId = `${baseId}-${item.id}`

              return (
                <motion.div
                  className="industry-faq-item"
                  data-open={isOpen}
                  key={item.id}
                  variants={revealVariants('up', reduced, 0.8)}
                >
                  <button
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    className="industry-faq-trigger"
                    onClick={() => toggle(item.id)}
                    type="button"
                  >
                    <span className="industry-faq-question">{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen && !reduced ? 180 : 0 }}
                      aria-hidden="true"
                      className="industry-faq-icon"
                      transition={{ duration: 0.4, ease: EASE }}
                    >
                      {isOpen ? <MinusIcon /> : <PlusIcon />}
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        animate={expand.animate}
                        className="industry-faq-answer-clip"
                        exit={expand.exit}
                        id={panelId}
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        <div className="industry-faq-answer">
                          <RichText value={item.answer} />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
