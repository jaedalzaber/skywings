import { ButtonLink } from '@/components/atoms/ButtonLink'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import { RFQForm } from '@/components/forms/RFQForm'
import type { ProductFilters } from '@/data/catalog'
import type { PageLayout } from '@/data/pages'

import {
  BlogListingSection,
  BrochureListingSection,
  CapabilityListingSection,
  IndustryListingSection,
  ProductListingSection,
} from '../collections/ListingSections'

type PageBlocksProps = {
  blocks: PageLayout
  filters?: ProductFilters
  submitted?: boolean
}

export async function PageBlocks(props: PageBlocksProps) {
  const rendered = await Promise.all(
    props.blocks.map((block, index) => renderBlock(block, index, props)),
  )

  return <>{rendered}</>
}

async function renderBlock(
  block: PageLayout[number],
  index: number,
  context: Omit<PageBlocksProps, 'blocks'>,
) {
  const key = `${block.blockType}-${block.id ?? index}`

  switch (block.blockType) {
    case 'pageHero':
      return (
        <section className="page-hero" key={key}>
          <SectionHeading
            description={block.description}
            eyebrow={block.eyebrow}
            heading={block.heading}
            wide
          />
          <div className="hero-actions">
            {block.primaryLabel && block.primaryHref ? (
              <ButtonLink href={block.primaryHref}>{block.primaryLabel}</ButtonLink>
            ) : null}
            {block.secondaryLabel && block.secondaryHref ? (
              <ButtonLink href={block.secondaryHref} variant="secondary">
                {block.secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        </section>
      )
    case 'capabilityListing':
      return <CapabilityListingSection key={key} {...block} />
    case 'industryListing':
      return <IndustryListingSection key={key} {...block} />
    case 'productListing':
      return (
        <ProductListingSection
          filters={context.filters}
          key={key}
          showFilters={block.showFilters}
          {...block}
        />
      )
    case 'brochureListing':
      return <BrochureListingSection key={key} {...block} />
    case 'blogListing':
      return <BlogListingSection key={key} {...block} />
    case 'contactRFQ':
      return (
        <section className="rfq-section" key={key}>
          <div className="rfq-copy">
            <SectionHeading
              description={block.description}
              eyebrow={block.eyebrow}
              heading={block.heading}
              wide
            />
            <div className="contact-lines">
              {block.contactEmail ? (
                <a href={`mailto:${block.contactEmail}`}>{block.contactEmail}</a>
              ) : null}
              {block.contactPhone ? (
                <a href={`tel:${block.contactPhone}`}>{block.contactPhone}</a>
              ) : null}
            </div>
          </div>
          <RFQForm sourcePage="/contact" submitted={context.submitted} />
        </section>
      )
    case 'cta':
      return (
        <section className="cta-section" key={key}>
          <h2>{block.heading}</h2>
          {block.content ? <p>{block.content}</p> : null}
          <div className="hero-actions">
            {block.actions?.map((action) => (
              <ButtonLink
                href={action.href}
                key={action.id ?? action.href}
                openInNewTab={action.openInNewTab}
                variant={action.style}
              >
                {action.label}
              </ButtonLink>
            ))}
          </div>
        </section>
      )
    default:
      return null
  }
}
