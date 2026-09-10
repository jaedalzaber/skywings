import type { LogoCloudBlock } from '@/payload-types'

import { Reveal, RevealGroup, RevealItem } from './Reveal'
import { SectionShell } from './SectionShell'
import { headingId, LogoImage } from './shared'

/**
 * Standalone logo row. This block predates the industry pages and has no
 * theme or anchor settings, so it always renders on the light surface.
 */
export function LogoCloudSection(props: { block: LogoCloudBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-logos')
  const logos = block.logos.filter((logo) => logo.name?.trim())

  if (logos.length === 0) {
    return null
  }

  return (
    <SectionShell
      className="industry-logo-cloud"
      labelledBy={block.heading ? id : undefined}
      theme="light"
    >
      {block.heading ? (
        <Reveal as="h2" className="industry-logo-cloud-heading" effect="fade" id={id}>
          {block.heading}
        </Reveal>
      ) : null}

      <RevealGroup as="ul" className="industry-logo-list" stagger={0.06}>
        {logos.map((logo) => {
          const Frame = logo.href ? 'a' : 'span'

          return (
            <RevealItem as="li" effect="scale" key={logo.id ?? logo.name}>
              <Frame
                aria-label={logo.href ? logo.name : undefined}
                className="industry-logo"
                href={logo.href ?? undefined}
              >
                <LogoImage alt={logo.name} media={logo.logo} />
              </Frame>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </SectionShell>
  )
}
