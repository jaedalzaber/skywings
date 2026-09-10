'use client'

import { Fragment, useState } from 'react'

import { SafeImg } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
// Values come from the client-safe module: a value import from '@/data/home'
// here would pull the Payload client into the browser bundle.
import {
  defaultHomeMachiningGroups,
  defaultHomeMachiningIntro,
  defaultHomeMachiningStats,
  type HomeMachiningGroup,
  type HomeMachiningStat,
} from '@/data/homeMachiningDefaults'
// Type-only, so the Payload client stays out of the browser bundle.
import type { HomeMachiningLayoutBlock } from '@/data/home'

type Props = {
  /**
   * The CMS block, when the home page carries one. Its fields are already
   * filled from the committed defaults by the data layer, so anything left
   * empty in the admin still reads as authored here.
   */
  block?: HomeMachiningLayoutBlock
  /** Falls back to the committed capability list. */
  groups?: readonly HomeMachiningGroup[]
  /** Set beside the heading; falls back to the committed figures. */
  stats?: readonly HomeMachiningStat[]
}

/**
 * Machining capability.
 *
 * A dark full-bleed section: the heading sits in its own framed cell, and the
 * cells below are an accordion of machine groups. One group is open at a
 * time -- its row becomes a brand-blue bar with a close control, and the panel
 * under it sets the machine list against a photograph of the cell, stepped
 * through with the arrows.
 *
 * Everything here is CSS and one piece of state; there is no scroll
 * choreography, so the section behaves the same at every viewport and under a
 * reduced-motion preference (only the open/close easing is dropped).
 */
export function HomeMachiningSection({ block, groups, stats }: Props) {
  // Block, then an explicit prop, then the committed defaults.
  const capabilityGroups = block?.groups?.length
    ? block.groups
    : (groups ?? defaultHomeMachiningGroups)
  const figures = block?.stats?.length ? block.stats : (stats ?? defaultHomeMachiningStats)
  const intro = {
    eyebrow: block?.eyebrow || defaultHomeMachiningIntro.eyebrow,
    heading: block?.heading || defaultHomeMachiningIntro.heading,
  }
  // First group open on arrival, so the pattern is legible without a click.
  const [openId, setOpenId] = useState<string | null>(capabilityGroups[0]?.id ?? null)
  /*
   * Keyed by group, not a single index: stepping through one cell's
   * photographs and then reopening it later should return to where it was
   * left, and a shared index would point past the end of a shorter group.
   */
  const [slides, setSlides] = useState<Record<string, number>>({})

  if (capabilityGroups.length === 0) return null

  function step(group: HomeMachiningGroup, delta: number) {
    setSlides((current) => {
      const count = group.images.length || 1
      const next = ((current[group.id] ?? 0) + delta + count) % count
      return { ...current, [group.id]: next }
    })
  }

  return (
    <section
      aria-labelledby="machining-title"
      className="machining"
      data-nav-surface="dark"
      data-responsive-layout="machining"
      id="machining-capability"
    >
      <div className="machining-inner">
        <header className="machining-head">
          {/* Eyebrow first, then the heading a line at a time: the stagger
              runs straight through the plain <h2> between them, because the
              order comes from the React tree rather than the DOM. */}
          <RevealGroup className="machining-head-title" stagger={0.09}>
            <RevealItem as="p" className="machining-eyebrow">
              {intro.eyebrow}
            </RevealItem>
            <h2 className="machining-title" id="machining-title">
              {intro.heading.split('\n').map((line, index) => (
                <Fragment key={line}>
                  {/* A real space between the lines: the spans are blocks, so
                      it is not drawn, but without it the accessible name runs
                      the halves together as "Machiningcapability". */}
                  {index > 0 ? ' ' : null}
                  <RevealItem as="span" className="machining-title-line">
                    {line}
                  </RevealItem>
                </Fragment>
              ))}
            </h2>
          </RevealGroup>

          {/*
           * A description list, read as "Machines, 30+": the label comes
           * first in the document and the stylesheet lifts the figure above
           * it, so the reading order stays sensible while the figure leads
           * visually.
           */}
          <RevealGroup as="dl" className="machining-stats" stagger={0.08}>
            {figures.map((stat) => (
              <RevealItem className="machining-stat" key={stat.label}>
                <dt className="machining-stat-label">{stat.label}</dt>
                <dd className="machining-stat-value">{stat.value}</dd>
              </RevealItem>
            ))}
          </RevealGroup>
        </header>

        <RevealGroup className="machining-list" stagger={0.06}>
          {capabilityGroups.map((group) => {
            const open = group.id === openId
            const index = Math.min(slides[group.id] ?? 0, Math.max(group.images.length - 1, 0))
            const image = group.images[index]

            return (
              <RevealItem className="machining-item" data-open={open ? 'true' : 'false'} key={group.id}>
                <h3 className="machining-row-heading">
                  <button
                    aria-controls={`machining-panel-${group.id}`}
                    aria-expanded={open}
                    className="machining-row"
                    id={`machining-row-${group.id}`}
                    onClick={() => setOpenId(open ? null : group.id)}
                    type="button"
                  >
                    <span className="machining-row-title">{group.title}</span>
                    {/* Plus while closed, cross while open -- both drawn in CSS
                        off data-open, so no icon is swapped in the markup. */}
                    <span aria-hidden="true" className="machining-row-icon" />
                  </button>
                </h3>

                {/*
                 * Always rendered and collapsed with a 0fr grid row rather than
                 * mounted on open: the panel eases open to its own height with
                 * no measured pixel value. Closed it is `visibility: hidden`,
                 * which keeps it out of the tab order and the accessibility
                 * tree without unmounting the machine list.
                 */}
                <div
                  aria-labelledby={`machining-row-${group.id}`}
                  className="machining-panel"
                  data-open={open ? 'true' : 'false'}
                  id={`machining-panel-${group.id}`}
                  role="region"
                >
                  <div className="machining-panel-inner">
                    <ul className="machining-machines">
                      {group.machines.map((machine, machineIndex) => (
                        <li key={`${machine}-${machineIndex}`}>{machine}</li>
                      ))}
                    </ul>

                    <figure className="machining-media">
                      <div className="machining-media-frame">
                        {image ? (
                          <SafeImg
                            alt={image.alt}
                            className="machining-media-image"
                            loading="lazy"
                            src={image.url}
                          />
                        ) : null}
                      </div>
                      {group.images.length > 1 ? (
                        <figcaption className="machining-media-nav">
                          <button
                            className="machining-media-arrow"
                            onClick={() => step(group, -1)}
                            type="button"
                          >
                            <span className="machining-visually-hidden">
                              Previous {group.title} photograph
                            </span>
                            <span aria-hidden="true">&#8592;</span>
                          </button>
                          <button
                            className="machining-media-arrow"
                            onClick={() => step(group, 1)}
                            type="button"
                          >
                            <span className="machining-visually-hidden">
                              Next {group.title} photograph
                            </span>
                            <span aria-hidden="true">&#8594;</span>
                          </button>
                        </figcaption>
                      ) : null}
                    </figure>
                  </div>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
