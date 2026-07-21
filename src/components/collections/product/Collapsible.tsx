'use client'

import { type ReactNode, useState } from 'react'

import { MinusIcon, PlusIcon } from '@/components/atoms/icons'

/**
 * Collapsible section used for Specification and Technical Drawing.
 * Fully controlled so the open state and the +/- indicator stay in sync —
 * an uncontrolled `<details open>` is reset by React 19 hydration.
 */
export function Collapsible(props: {
  children: ReactNode
  defaultOpen?: boolean
  title: string
}) {
  const { children, defaultOpen = true, title } = props
  const [open, setOpen] = useState(defaultOpen)

  return (
    <details className="pdp-collapsible" open={open}>
      <summary
        className="pdp-collapsible-summary"
        onClick={(event) => {
          event.preventDefault()
          setOpen((value) => !value)
        }}
      >
        <span className="pdp-section-title">{title}</span>
        <span aria-hidden className="pdp-toggle">
          {open ? <MinusIcon /> : <PlusIcon />}
        </span>
      </summary>
      {children}
    </details>
  )
}
