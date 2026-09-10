import type { IndustryIntroBlock } from '@/payload-types'

import { RichText } from '@/components/atoms/RichText'

import { Reveal, RevealGroup, RevealItem } from './Reveal'
import { SectionShell } from './SectionShell'
import { headingId, SectionActions, SectionEyebrow } from './shared'

/**
 * Two-column introduction. The first intro on a page carries the `<h1>`,
 * because the hero above it holds the company tagline rather than the
 * industry name; later intros (rare) demote to `<h2>`.
 */
export function IndustryIntroSection(props: {
  block: IndustryIntroBlock
  headingLevel?: 'h1' | 'h2'
}) {
  const { block, headingLevel = 'h2' } = props
  const id = headingId(block.id, 'industry-intro')
  const lines = block.headingLines.filter((line) => line.text?.trim())

  return (
    <SectionShell
      anchorId={block.anchorId}
      className={`industry-intro is-${block.layout ?? 'split'}`}
      labelledBy={id}
      theme={block.theme}
    >
      <div className="industry-intro-grid">
        <div className="industry-intro-heading-col">
          <Reveal eager={headingLevel === 'h1'} effect="fade">
            <SectionEyebrow>{block.eyebrow}</SectionEyebrow>
          </Reveal>
          <RevealGroup
            as={headingLevel}
            className="industry-intro-heading"
            delayChildren={headingLevel === 'h1' ? 0.9 : 0}
            eager={headingLevel === 'h1'}
            id={id}
            stagger={0.12}
          >
            {lines.map((line, index) => (
              <RevealItem
                as="span"
                className={`industry-intro-line is-${line.emphasis ?? 'strong'}`}
                effect="clip"
                key={line.id ?? `${line.text}-${index}`}
              >
                {line.text}
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* The page's first intro sits just under the hero on load, so it joins
            the entrance sequence instead of waiting to be scrolled to. */}
        <Reveal
          className="industry-intro-copy"
          delay={headingLevel === 'h1' ? 1.15 : 0.2}
          eager={headingLevel === 'h1'}
        >
          <RichText className="industry-prose" value={block.description} />
          <SectionActions links={[block.primaryAction, block.secondaryAction]} />
        </Reveal>
      </div>
    </SectionShell>
  )
}
