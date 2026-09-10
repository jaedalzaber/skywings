import { ButtonLink } from '@/components/atoms/ButtonLink'
import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { getMediaImage } from '@/data/media'

/** Shape produced by `optionalLinkGroup` in `src/fields/link.ts`. */
export type OptionalLink =
  | {
      href?: null | string
      label?: null | string
      openInNewTab?: boolean | null
      style?: 'primary' | 'secondary' | 'text' | null
    }
  | null
  | undefined

export function hasLink(link: OptionalLink): link is NonNullable<OptionalLink> & {
  href: string
  label: string
} {
  return Boolean(link?.label?.trim() && link?.href?.trim())
}

/**
 * Renders the call-to-action row for a section. Empty slots are skipped, and
 * the row itself is omitted when nothing is left, so no section carries an
 * empty flex container and its margin.
 */
export function SectionActions(props: { className?: string; links: OptionalLink[] }) {
  const links = props.links.filter(hasLink)

  if (links.length === 0) {
    return null
  }

  return (
    <div className={['industry-actions', props.className].filter(Boolean).join(' ')}>
      {links.map((link, index) => (
        <ButtonLink
          href={link.href}
          key={`${link.href}-${index}`}
          openInNewTab={link.openInNewTab}
          variant={link.style}
        >
          {link.label}
        </ButtonLink>
      ))}
    </div>
  )
}

/** Textarea value rendered as a paragraph with its line breaks kept. */
export function MultilineText(props: { as?: 'p' | 'span'; className?: string; value: string }) {
  const { as: Tag = 'p', className, value } = props
  const lines = value.split('\n')

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </Tag>
  )
}

export function SectionEyebrow(props: { children?: null | string }) {
  if (!props.children) {
    return null
  }

  return <p className="industry-eyebrow">{props.children}</p>
}

/**
 * Logo inside a fixed box. Uses `fill` + `object-fit: contain` because logo
 * uploads arrive at every imaginable aspect ratio.
 */
export function LogoImage(props: { alt: string; media: unknown; sizes?: string }) {
  const image = getMediaImage(props.media)

  if (!image) {
    return <span aria-hidden="true" className="industry-logo-missing" />
  }

  return (
    <Image
      alt={props.alt}
      fill
      loading="lazy"
      sizes={props.sizes ?? '8rem'}
      src={image.url}
      unoptimized={/\.svg(?:[?#]|$)/i.test(image.url)}
    />
  )
}

export function headingId(blockId: null | string | undefined, fallback: string) {
  return `${fallback}-${(blockId ?? 'section').replace(/[^a-z0-9-]/gi, '')}`
}
