'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MinusIcon, PlusIcon } from '@/components/atoms/icons'
import type { Product } from '@/payload-types'

type OptionGroup = NonNullable<Product['configurationOptions']>[number]

function contrastText(hex: string): string {
  const value = hex.replace('#', '')
  if (value.length !== 3 && value.length !== 6) {
    return '#ffffff'
  }
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  // Perceived luminance — dark text on light swatches, white on dark.
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#262626' : '#ffffff'
}

export function ProductConfigurator(props: { groups: OptionGroup[]; quoteHref: string }) {
  const { groups, quoteHref } = props

  // Track the selected option index per group (visual-only for now).
  const [selected, setSelected] = useState<Record<number, number>>(() =>
    Object.fromEntries(groups.map((_, index) => [index, 0])),
  )
  const [quantity, setQuantity] = useState(1)

  return (
    <section className="pdp-configurator" aria-label="Choose options">
      <h2 className="pdp-section-title pdp-configurator-title">Choose options:</h2>

      {groups.length ? (
        <div className="pdp-option-groups">
          {groups.map((group, groupIndex) => (
            <fieldset className="pdp-option-group" key={group.id ?? group.group}>
              <legend className="pdp-option-label">{group.group}</legend>
              <div className="pdp-option-pills">
                {(group.options ?? []).map((option, optionIndex) => {
                  const isActive = selected[groupIndex] === optionIndex
                  const swatch = option.swatch?.trim()
                  const style =
                    swatch && isActive
                      ? { backgroundColor: swatch, borderColor: swatch, color: contrastText(swatch) }
                      : swatch
                        ? { borderColor: swatch }
                        : undefined

                  return (
                    <button
                      aria-pressed={isActive}
                      className="pdp-pill"
                      data-active={isActive ? '' : undefined}
                      key={option.id ?? option.value}
                      onClick={() =>
                        setSelected((prev) => ({ ...prev, [groupIndex]: optionIndex }))
                      }
                      style={style}
                      type="button"
                    >
                      {swatch && !isActive ? (
                        <span className="pdp-swatch-dot" style={{ backgroundColor: swatch }} />
                      ) : null}
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      <div className="pdp-quote-row">
        <div className="pdp-quantity">
          <span className="pdp-quantity-label">Quantity: {quantity}</span>
          <div className="pdp-quantity-stepper">
            <button
              aria-label="Decrease quantity"
              className="pdp-quantity-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              type="button"
            >
              <MinusIcon />
            </button>
            <span className="pdp-quantity-divider" aria-hidden />
            <button
              aria-label="Increase quantity"
              className="pdp-quantity-btn"
              onClick={() => setQuantity((q) => q + 1)}
              type="button"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        <Link className="pdp-add-to-quote" href={quoteHref}>
          Add to Quote
        </Link>
      </div>
    </section>
  )
}
