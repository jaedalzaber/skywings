import { Eyebrow } from './Eyebrow'

type SectionHeadingProps = {
  eyebrow?: string | null
  heading: string
  description?: string | null
  id?: string
  wide?: boolean
  sticky?: boolean
}

export function SectionHeading(props: SectionHeadingProps) {
  const { eyebrow, heading, description, id, sticky, wide } = props
  const className = ['section-heading', wide ? 'wide-heading' : '', sticky ? 'sticky-heading' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id}>{heading}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
