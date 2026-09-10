'use client'

import { useEffect, useRef } from 'react'

import { SafeImg } from '@/components/atoms/SafeImage'
import type { HomeProcessLayoutBlock } from '@/data/home'
// Values come from the client-safe module: a value import from '@/data/home'
// here would pull the Payload client into the browser bundle.
import {
  defaultHomeProcessCta,
  defaultHomeProcessIntro,
  defaultHomeProcessSteps,
  defaultHomeProcessSummary,
} from '@/data/homeProcessDefaults'

import { onFirstMediaMatch, watchHeaderCondense } from './scrollTriggerRefresh'

/**
 * The accordion runs only where it can be read as one: a wide viewport and no
 * reduced-motion preference. Everywhere else the same markup is a stacked list
 * of cards, so nothing is pinned and nothing scrolls sideways on a phone.
 */
export const PROCESS_ACCORDION_MEDIA =
  '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

export function HomeProcessSection({ block }: { block: HomeProcessLayoutBlock }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLOListElement | null>(null)
  const progressRef = useRef<HTMLSpanElement | null>(null)

  const steps = block.steps.map((step, index) => {
    const fallback = defaultHomeProcessSteps[index]

    return {
      description: step.description || fallback?.description || '',
      icon: step.infographicImage ?? null,
      id: step.id ?? `${step.title}-${index}`,
      label: step.label || fallback?.label || step.title,
      title: step.title || fallback?.title || '',
    }
  })

  // Field by field, so an editor clearing one line gets its default back
  // rather than an empty label or a link with no href.
  const authored = stripEmpty(block.cta)
  const intro = block.intro?.length ? block.intro : defaultHomeProcessIntro
  const summary = block.summary?.length ? block.summary : defaultHomeProcessSummary

  const cta = {
    copy: authored.copy ?? defaultHomeProcessCta.copy,
    ctaHref: authored.ctaHref ?? defaultHomeProcessCta.ctaHref,
    ctaLabel: authored.ctaLabel ?? defaultHomeProcessCta.ctaLabel,
    heading: authored.heading ?? defaultHomeProcessCta.heading,
    label: authored.label ?? defaultHomeProcessCta.label,
  }

  useEffect(() => {
    const section = sectionRef.current
    const pin = pinRef.current
    const track = trackRef.current
    if (!section || !pin || !track) return

    let active = true
    let cleanup: (() => void) | undefined

    async function setup() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (!active || !section || !pin || !track) return

      gsap.registerPlugin(ScrollTrigger)
      // The header condensing shifts the layout above every pin; see the helper.
      const stopWatching = watchHeaderCondense(ScrollTrigger)

      const media = gsap.matchMedia()

      media.add(PROCESS_ACCORDION_MEDIA, () => {
        const panels = Array.from(track.querySelectorAll<HTMLElement>('[data-panel]'))
        const stepPanels = panels.filter((panel) => panel.dataset.panel === 'step')
        const ctaPanel = track.querySelector<HTMLElement>('[data-panel="cta"]')
        const progress = progressRef.current
        if (stepPanels.length === 0 || !ctaPanel) return undefined

        /*
         * Both widths come from the stylesheet rather than being computed
         * here: CSS sizes the first step to --process-expand and the rail to
         * --process-rail, so the two stay in step through every breakpoint.
         * Inline widths are cleared first, or we would measure the previous
         * animation's output.
         */
        const dims = { rail: 0 }
        const probe = stepPanels[stepPanels.length - 1]

        const measure = () => {
          stepPanels.forEach((panel) => {
            panel.style.removeProperty('flex-grow')
            panel.style.removeProperty('flex-basis')
          })
          /*
           * Read back rather than parsed: --process-rail is a clamp(), and a
           * custom property comes out of getComputedStyle unresolved. Setting
           * it inline and measuring makes the browser do the arithmetic.
           */
          probe.style.flexBasis = 'var(--process-rail)'
          dims.rail = probe.getBoundingClientRect().width
          probe.style.removeProperty('flex-basis')
        }

        const stepDistance = () => Math.min(Math.max(window.innerHeight * 0.45, 280), 520)
        const holdDistance = () => window.innerHeight * 0.25

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            end: () => `+=${stepPanels.length * stepDistance() + holdDistance()}`,
            invalidateOnRefresh: true,
            onRefreshInit: measure,
            pin,
            /*
             * A longer scrub is what makes the pin feel soft: the row eases
             * toward the scroll position instead of tracking it exactly, so
             * arriving at the section no longer reads as a hard lock.
             * anticipatePin is deliberately absent -- it pins early, which is
             * itself visible as a jump.
             */
            scrub: 1.2,
            start: 'top top',
            trigger: section,
          },
        })

        measure()
        // Steps outside the opening window hold their copy hidden until their
        // turn, so nothing flashes before the first tween.
        stepPanels.slice(2).forEach((panel) => {
          gsap.set(panel.querySelectorAll('[data-fade]'), { opacity: 0 })
        })

        /*
         * One slot per step, with a two-step window open at any time. A step
         * emerges two slots before its own (so the row starts full instead of
         * showing one over-wide panel) and collapses to a rail on its slot.
         *
         * Only flex is animated: an open step grows into whatever the rails
         * and the closing panel leave, so the row cannot develop a gap and the
         * closing panel keeps its fixed basis throughout.
         */
        /*
         * Two steps are open at rest so the row starts full without any card
         * being squeezed. They collapse in turn, and from the third on it is
         * strictly one at a time -- each emerges exactly as its predecessor
         * collapses, so two are only ever on screen together mid-transition.
         */
        const openAtStart = 2

        stepPanels.forEach((panel, index) => {
          const fading = panel.querySelectorAll<HTMLElement>('[data-fade]')
          const title = panel.querySelector<HTMLElement>('.process-panel-title')
          const emergesAt = index < openAtStart ? -1 : index - 1

          if (emergesAt >= 0) {
            timeline.fromTo(
              panel,
              { flexGrow: 0 },
              { duration: 1, flexGrow: 1, immediateRender: false },
              emergesAt,
            )
            /*
             * Runs across almost the whole opening rather than a short burst at
             * the end, so the copy arrives with the panel instead of popping in
             * once it has stopped.
             */
            timeline.fromTo(
              fading,
              { opacity: 0 },
              { duration: 0.75, ease: 'power2.out', immediateRender: false, opacity: 1 },
              emergesAt + 0.05,
            )
            // The title travels the last of that distance itself, so it reads
            // as sliding in with the panel rather than fading in on the spot.
            if (title) {
              timeline.fromTo(
                title,
                { x: 28 },
                { duration: 0.75, ease: 'power2.out', immediateRender: false, x: 0 },
                emergesAt + 0.05,
              )
            }
          }

          timeline.fromTo(
            panel,
            { flexBasis: 0, flexGrow: 1 },
            { duration: 1, flexBasis: () => dims.rail, flexGrow: 0, immediateRender: false },
            index,
          )
          /*
           * Faded over the middle of the collapse, not the tail of it. The clip
           * windows used to carry a gradient mask that dissolved the copy as it
           * slid behind the rail, which let this hold full opacity almost to
           * the end. With the copy fading as a whole instead, it has to be gone
           * before the panel is narrow enough to cut it -- otherwise the last
           * of it is chopped off mid-letter by the window's straight edge.
           */
          timeline.fromTo(
            fading,
            { opacity: 1 },
            { duration: 0.45, ease: 'power2.in', immediateRender: false, opacity: 0 },
            index + 0.2,
          )
        })

        // Its turn: with every step railed, the closing panel takes the rest.
        timeline.fromTo(
          ctaPanel,
          { flexGrow: 0 },
          { duration: 1, flexGrow: 1, immediateRender: false },
          stepPanels.length - 1,
        )

        /*
         * The closing panel's copy is hidden while the panel is still a rail --
         * at that width it wrapped to a column of single words behind the
         * heading -- and fades in over the unfold, as a step's copy does.
         */
        const ctaFading = ctaPanel.querySelectorAll<HTMLElement>('[data-fade]')
        if (ctaFading.length) {
          gsap.set(ctaFading, { opacity: 0 })
          timeline.fromTo(
            ctaFading,
            { opacity: 0 },
            { duration: 0.75, ease: 'power2.out', immediateRender: false, opacity: 1 },
            stepPanels.length - 1 + 0.25,
          )
        }

        /*
         * A spine of the full length, so the progress rail maps to the whole
         * pinned range including the hold at the end.
         */
        const total = stepPanels.length + 0.4
        timeline.to({}, { duration: total }, 0)

        if (progress) {
          timeline.fromTo(
            progress,
            { scaleX: 0 },
            { duration: total, immediateRender: false, scaleX: 1 },
            0,
          )
        }

        return () => {
          timeline.scrollTrigger?.kill()
          timeline.kill()
          panels.forEach((panel) => {
            panel.style.removeProperty('flex-grow')
            panel.style.removeProperty('flex-basis')
            panel
              .querySelectorAll<HTMLElement>('[data-fade]')
              .forEach((el) => el.style.removeProperty('opacity'))
          })
          progress?.style.removeProperty('transform')
        }
      })

      cleanup = () => {
        stopWatching()
        media.revert()
      }
      ScrollTrigger.refresh()
    }

    // GSAP is only fetched once the scene can play.
    const cancelStart = onFirstMediaMatch(PROCESS_ACCORDION_MEDIA, () => void setup())

    return () => {
      cancelStart()
      active = false
      cleanup?.()
    }
  }, [steps.length])

  return (
    <section
      aria-labelledby="manufacturing-process-title"
      className="manufacturing-process"
      // Flips the header to its dark treatment while the bar is over this
      // section, and back on the way out. See HeaderSurfaceController.
      data-nav-surface="dark"
      data-responsive-layout="process"
      data-scroll-scene="process-accordion"
      id="manufacturing-process"
      ref={sectionRef}
    >
      <div className="process-pin" ref={pinRef}>
        <div className="process-shell">
          <div className="process-head">
            <h2 className="process-heading" id="manufacturing-process-title">
              {block.heading}
            </h2>
            {intro.length ? <p className="process-intro">{renderSegments(intro)}</p> : null}
          </div>

          <div className="process-band">
            <ol className="process-accordion" ref={trackRef}>
            {steps.map((step, index) => (
              <li className="process-panel" data-panel="step" data-step={index + 1} key={step.id}>
                <div className="process-panel-inner">
                  <div className="process-panel-rail">
                    <span className="process-panel-label">{step.label}</span>
                    {step.icon ? (
                      <span className="process-panel-icon">
                        <SafeImg alt={step.icon.alt} src={step.icon.url} />
                      </span>
                    ) : null}
                  </div>

                  {/* Window bounded by the rail; the title slides behind it. */}
                  <div className="process-panel-title-clip">
                    <h3 className="process-panel-title" data-fade>
                      {step.title}
                    </h3>
                  </div>
                  {/* Window again, dissolving at its trailing edge. */}
                  <div className="process-panel-body-clip">
                    <p className="process-panel-description" data-fade>
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}

            <li className="process-panel process-panel--cta" data-panel="cta">
              <div className="process-panel-inner">
                <div className="process-cta-copy">
                  {/* <p className="process-cta-label">{cta.label}</p> */}
                  <h3 className="process-cta-heading">{cta.heading}</h3>
                  {/* data-fade: the copy stays hidden while this panel is still
                      a rail and fades in as it unfolds, like a step's does. */}
                  <p className="process-cta-text" data-fade>
                    {cta.copy}
                  </p>
                </div>
                <a className="process-cta-link" href={cta.ctaHref}>
                  {cta.ctaLabel}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </li>
            </ol>
          </div>

          {summary.length ? <p className="process-summary">{renderSegments(summary)}</p> : null}
        </div>

        {/* Pinned box, not the shell: the cue belongs on the screen's edge. */}
        <div aria-hidden="true" className="process-progress">
          <span ref={progressRef} />
        </div>
      </div>
    </section>
  )
}

/** Muted copy with the emphasised runs brought forward. */
function renderSegments(
  segments: readonly { emphasis?: boolean | null; id?: string | null; text: string }[],
) {
  return segments.map((segment, index) => (
    <span
      className={segment.emphasis ? 'process-emphasis' : undefined}
      key={segment.id ?? `${segment.text}-${index}`}
    >
      {segment.text}
    </span>
  ))
}

/** Drops null, undefined and empty-string entries, narrowing what remains to strings. */
function stripEmpty(
  value: Record<string, string | null | undefined> | null | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, entry] of Object.entries(value ?? {})) {
    if (entry) result[key] = entry
  }

  return result
}
