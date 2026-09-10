'use client'

import { useState } from 'react'

import { SafeImg } from '@/components/atoms/SafeImage'
import {
  buildCapabilitySlides,
  machineMaker,
  type CapabilityProcess,
  type CapabilitySlide,
} from '@/data/capabilityDefaults'

/**
 * The top of a process panel, in the home machining section's shape: the
 * machines on the left as a mono list, the photographs on the right in a
 * carousel stepped through with the arrows along its foot.
 *
 * The two are one control. The list names each machine and model; the
 * carousel shows the one selected, full and uncropped, with nothing printed
 * over or under it -- the photograph is the content. What a machine is
 * appears once, in the mono list beside it, rather than repeated under the
 * image on every step.
 */
export function CapabilityMachinePark({ process }: { process: CapabilityProcess }) {
  const slides = buildCapabilitySlides(process)
  const [index, setIndex] = useState(0)
  // Clamped: the admin can remove photographs while an index points past them.
  const current: CapabilitySlide | undefined = slides[Math.min(index, slides.length - 1)]
  const carouselId = `capability-${process.slug}-carousel`

  function step(delta: number) {
    setIndex((value) => (value + delta + slides.length) % slides.length)
  }

  return (
    <div className="capabilities-park">
      <div className="capabilities-park-copy">
        <p className="capabilities-process-summary">{process.summary}</p>

        {process.machines.length ? (
          <div>
            <p className="capabilities-label">Our machines</p>
            <ul className="capabilities-machine-list">
              {process.machines.map((machine) => {
                const active = current?.machineId === machine.id
                const maker = machineMaker(machine)

                return (
                  <li key={machine.id}>
                    <button
                      aria-controls={carouselId}
                      aria-pressed={active}
                      className="capabilities-machine-row"
                      data-active={active ? 'true' : 'false'}
                      onClick={() =>
                        setIndex(slides.findIndex((slide) => slide.machineId === machine.id))
                      }
                      type="button"
                    >
                      <span className="capabilities-machine-line">
                        {maker ? <span className="capabilities-machine-maker">{maker}</span> : null}
                        <span className="capabilities-machine-type">{machine.machineType}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <figure
        aria-label={`${process.title} photographs`}
        aria-roledescription="carousel"
        className="capabilities-carousel"
        id={carouselId}
      >
        <div className="capabilities-carousel-frame" data-kind={current?.kind}>
          {current?.image ? (
            <SafeImg
              alt={current.image.alt}
              className="capabilities-carousel-image"
              key={current.id}
              loading="lazy"
              src={current.image.url}
            />
          ) : (
            <span aria-hidden="true" className="capabilities-image-empty" />
          )}
        </div>

        {/* What came up, announced when the carousel steps -- the photograph
            speaks for itself, so nothing is printed over or under it. */}
        <p aria-live="polite" className="capabilities-visually-hidden">
          {current?.caption}
        </p>

        {slides.length > 1 ? (
          <div className="capabilities-carousel-nav">
            <button className="capabilities-carousel-arrow" onClick={() => step(-1)} type="button">
              <span className="capabilities-visually-hidden">
                Previous {process.title} photograph
              </span>
              <span aria-hidden="true">&#8592;</span>
            </button>
            <button className="capabilities-carousel-arrow" onClick={() => step(1)} type="button">
              <span className="capabilities-visually-hidden">Next {process.title} photograph</span>
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        ) : null}
      </figure>
    </div>
  )
}
