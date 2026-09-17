import type { IndustryValueBlock } from '@/payload-types'
import { RichText } from '@/components/atoms/RichText'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { getMediaImage } from '@/data/media'

import { ValueCopy, ValueHeading, ValueMedia } from './IndustryValueMotion'
import { RevealGroup, RevealItem } from './Reveal'
import { SectionShell } from './SectionShell'
import { headingId, LogoImage } from './shared'

/**
 * Dark editorial band: emphasised heading and copy beside a feature image,
 * with an optional client-logo strip along the foot of the same surface.
 *
 * The heading rises word by word with a rule drawing in beneath it, the
 * description and its points follow in sequence, and the photograph is
 * uncovered and then drifts with the scroll; see IndustryValueMotion.
 */
export function IndustryValueSection(props: { block: IndustryValueBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-value')
  const image = getMediaImage(block.featureImage)
  const logos = (block.clientLogos ?? []).filter((logo) => logo.name?.trim())

  return (
    <SectionShell
      anchorId={block.anchorId}
      bleed
      className="industry-value"
      labelledBy={id}
      theme={block.theme ?? 'dark'}
    >
      <div className="industry-container industry-value-grid">
        <div className="industry-value-copy">
          <ValueHeading
            className="industry-value-heading"
            id={id}
            segments={block.headingSegments}
          />
          <ValueCopy>
            <RichText className="industry-prose" value={block.description} />
          </ValueCopy>
          {block.logosLabel && logos.length > 0 ? (
            <p className="industry-value-logos-label">{block.logosLabel}</p>
          ) : null}
        </div>

        <ValueMedia>
          {image ? (
            <Image
              alt={image.alt}
              fill
              loading="lazy"
              sizes="(min-width: 64rem) 46vw, 100vw"
              src={image.url}
            />
          ) : null}
        </ValueMedia>
      </div>

      {logos.length > 0 ? (
        <div className="industry-logo-strip">
          <RevealGroup as="ul" className="industry-container industry-logo-list" stagger={0.06}>
            {logos.map((logo) => {
              const alt = logo.altOverride?.trim() || logo.name
              const Frame = logo.href ? 'a' : 'span'

              return (
                <RevealItem as="li" effect="fade" key={logo.id ?? logo.name}>
                  <Frame
                    aria-label={logo.href ? logo.name : undefined}
                    className="industry-logo"
                    href={logo.href ?? undefined}
                  >
                    <LogoImage alt={alt} media={logo.logo} />
                  </Frame>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      ) : null}
    </SectionShell>
  )
}
