import type { CustomProductCtaBlock } from '@/payload-types'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { getMediaImage } from '@/data/media'

import { Reveal } from './Reveal'
import { SectionShell, SegmentedHeading } from './SectionShell'
import { headingId, SectionActions } from './shared'

/**
 * Brand-blue call to action: framed feature image beside emphasised copy,
 * with an optional decorative watermark behind everything.
 */
export function CustomProductCtaSection(props: { block: CustomProductCtaBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-cta')
  const feature = getMediaImage(block.featureImage)
  const backdrop = getMediaImage(block.backgroundImage)

  return (
    <SectionShell
      anchorId={block.anchorId}
      bleed
      className="industry-cta"
      labelledBy={id}
      theme={block.theme ?? 'brand'}
    >
      {backdrop ? (
        <div aria-hidden="true" className="industry-cta-backdrop">
          <Image alt="" fill loading="lazy" sizes="100vw" src={backdrop.url} />
        </div>
      ) : null}

      <div className="industry-container industry-cta-grid">
        <Reveal as="figure" className="industry-cta-media" effect="clip">
          {feature ? (
            <Image
              alt={block.featureImageAlt?.trim() || ''}
              fill
              loading="lazy"
              sizes="(min-width: 64rem) 40vw, 100vw"
              src={feature.url}
            />
          ) : null}
        </Reveal>

        <Reveal className="industry-cta-copy" delay={0.15} effect="right">
          <SegmentedHeading
            className="industry-cta-heading"
            id={id}
            segments={block.headingSegments}
          />
          {block.description ? (
            <p className="industry-cta-description">{block.description}</p>
          ) : null}
          <SectionActions links={[block.action]} />
        </Reveal>
      </div>
    </SectionShell>
  )
}
