import { ButtonLink } from '@/components/atoms/ButtonLink'
import { SafeImg } from '@/components/atoms/SafeImage'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import {
  processNavLabel,
  type CapabilitiesCopy,
  type CapabilityImage,
  type CapabilityProcess,
} from '@/data/capabilityDefaults'

import { CapabilitiesIndex, CapabilitiesSubnav } from './CapabilitiesSubnav'
import { CapabilityMachinePark } from './CapabilityMachinePark'

type Props = {
  copy: CapabilitiesCopy
  processes: readonly CapabilityProcess[]
}

/**
 * The capabilities page, in the home page's machining-capability language:
 * a dark ground, a framed title cell, and each process as a brand-blue bar
 * over a light panel.
 *
 * Unlike the home section it is not an accordion. This page exists to be read
 * through, so every process stands open and there is nothing to close -- the
 * bars are headings, not controls. A sub-navigation pinned under the header
 * follows the reader down the page and jumps between processes; each panel
 * lists the machines that run the process beside a carousel of its
 * photographs, with the parts that come off them underneath.
 */
export function ProcessCapabilities({ copy, processes }: Props) {
  const items = processes.map((process) => ({
    label: processNavLabel(process),
    slug: process.slug,
    title: process.title,
  }))

  return (
    <div className="capabilities-page" data-nav-surface="dark">
      <div className="capabilities-inner">
        <header className="capabilities-head">
          <RevealGroup className="capabilities-head-title" stagger={0.09}>
            <RevealItem as="p" className="capabilities-eyebrow">
              {copy.eyebrow}
            </RevealItem>
            <RevealItem as="h1" className="capabilities-title">
              {copy.heading}
            </RevealItem>
          </RevealGroup>

          <div className="capabilities-head-aside">
            <Reveal as="p" className="capabilities-intro">
              {copy.description}
            </Reveal>
            <CapabilitiesIndex items={items} />
          </div>
        </header>

        {/* Fixed, so it takes no room here; it comes down once the list does. */}
        <CapabilitiesSubnav items={items} />

        <ol className="capabilities-list">
          {processes.map((process) => (
            <ProcessBlock key={process.id} process={process} />
          ))}
        </ol>

        <section aria-labelledby="capabilities-close-title" className="capabilities-close">
          <RevealGroup className="capabilities-close-inner" stagger={0.08}>
            <RevealItem
              as="h2"
              className="capabilities-close-heading"
              id="capabilities-close-title"
            >
              {copy.closingHeading}
            </RevealItem>
            <RevealItem as="p" className="capabilities-close-statement">
              {copy.closingStatement}
            </RevealItem>
            <RevealItem className="capabilities-close-actions">
              <ButtonLink href={copy.primaryHref} variant="primary">
                {copy.primaryLabel}
              </ButtonLink>
              <ButtonLink href={copy.secondaryHref} variant="secondary">
                {copy.secondaryLabel}
              </ButtonLink>
            </RevealItem>
          </RevealGroup>
        </section>
      </div>
    </div>
  )
}

function ProcessBlock({ process }: { process: CapabilityProcess }) {
  const titleId = `capability-${process.slug}-title`

  return (
    /*
     * A small in-view fraction on purpose: a process with six machines and nine
     * outputs runs to several screens on a phone, and a larger one could need
     * more of the element on screen than the viewport holds -- the reveal
     * would never fire and the process would sit hidden.
     */
    <Reveal
      amount={0.04}
      aria-labelledby={titleId}
      as="li"
      className="capabilities-process"
      id={process.slug}
    >
      <h2 className="capabilities-bar" id={titleId}>
        <span className="capabilities-bar-title">{process.title}</span>
      </h2>

      <div className="capabilities-panel">
        <CapabilityMachinePark process={process} />

        {process.outputs.length ? (
          <div className="capabilities-outputs">
            <p className="capabilities-label">Typical outputs</p>
            <ul className="capabilities-output-grid">
              {process.outputs.map((output, outputIndex) => (
                <li className="capabilities-output" key={`${output.label}-${outputIndex}`}>
                  <div className="capabilities-output-media">
                    <Picture className="capabilities-output-image" image={output.image} />
                  </div>
                  <span className="capabilities-output-label">{output.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Reveal>
  )
}

/*
 * Every image on the page comes from the admin, and until one is uploaded the
 * slot holds a quiet tone of the panel rather than a broken image or nothing
 * at all -- the grid keeps its shape either way.
 */
function Picture({ className, image }: { className: string; image: CapabilityImage | null }) {
  if (!image) return <span aria-hidden="true" className={`${className} capabilities-image-empty`} />

  return <SafeImg alt={image.alt} className={className} loading="lazy" src={image.url} />
}
