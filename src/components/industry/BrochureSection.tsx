import type { Brochure, BrochureBlock } from '@/payload-types'

import { MediaWireframe } from '@/components/atoms/MediaWireframe'
import { RichText } from '@/components/atoms/RichText'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { getMediaImage } from '@/data/media'

import { Reveal } from './Reveal'
import { MultilineHeading, SectionShell } from './SectionShell'
import { headingId, SectionActions } from './shared'

function asBrochure(value: unknown): Brochure | null {
  return typeof value === 'object' && value ? (value as Brochure) : null
}

/**
 * Brochure download. The file, cover and page count come from the linked
 * brochure record unless the block overrides them, so a replaced PDF updates
 * every page that offers it.
 */
export function BrochureSection(props: { block: BrochureBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-brochure')

  const brochure = asBrochure(block.source === 'file' ? block.file : block.brochure)
  const cover = getMediaImage(block.coverImage) ?? getMediaImage(brochure?.coverImage)
  const fileUrl = brochure?.url ?? null
  const pageCount = block.pageCount ?? brochure?.pageCount ?? null
  const format = block.format?.trim() || 'PDF'

  const downloadHref = block.downloadAction?.href?.trim() || fileUrl
  const download = downloadHref
    ? {
        href: downloadHref,
        label: block.downloadAction?.label?.trim() || 'Download PDF',
        openInNewTab: block.downloadAction?.openInNewTab ?? true,
        style: block.downloadAction?.style ?? 'primary',
      }
    : null

  return (
    <SectionShell
      anchorId={block.anchorId}
      className="industry-brochure"
      labelledBy={id}
      theme={block.theme}
    >
      <div className="industry-brochure-grid">
        <Reveal className="industry-brochure-copy">
          <MultilineHeading className="industry-brochure-heading" id={id} value={block.heading} />
          <RichText className="industry-prose" value={block.description} />

          <dl className="industry-brochure-meta">
            <div>
              <dt>Format:</dt>
              <dd>{format}</dd>
            </div>
            {pageCount ? (
              <div>
                <dt>Pages:</dt>
                <dd>{pageCount}</dd>
              </div>
            ) : null}
          </dl>

          <SectionActions links={[download, block.secondaryAction]} />
        </Reveal>

        <Reveal
          as="figure"
          className="industry-brochure-cover"
          delay={0.15}
          effect="scale"
          style={
            cover?.width && cover?.height
              ? { aspectRatio: `${cover.width} / ${cover.height}` }
              : undefined
          }
        >
          {cover ? (
            <Image
              alt={cover.alt}
              fill
              loading="lazy"
              sizes="(min-width: 48rem) 22rem, 80vw"
              src={cover.url}
            />
          ) : (
            <MediaWireframe label="brochure" />
          )}
        </Reveal>
      </div>
    </SectionShell>
  )
}
