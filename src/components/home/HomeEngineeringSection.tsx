import { SafeImg } from '@/components/atoms/SafeImage'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import {
  defaultEngineeringImage,
  defaultHomeEngineeringDisciplines,
  defaultHomeEngineeringIntro,
  defaultHomeEngineeringNote,
  type HomeEngineeringDiscipline,
} from '@/data/homeEngineeringDefaults'
import type { HomeEngineeringLayoutBlock } from '@/data/home'

type Props = {
  /**
   * The CMS block, when the home page carries one. Its fields are already
   * filled from the committed defaults by the data layer, so anything left
   * empty in the admin still reads as authored here.
   */
  block?: HomeEngineeringLayoutBlock
  /** Falls back to the committed discipline list. */
  disciplines?: readonly HomeEngineeringDiscipline[]
}

function DisciplineList(props: { items: string[]; lead: string }) {
  return (
    <>
      <p className="engineering-list-lead">{props.lead}</p>
      <ul className="engineering-list">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  )
}

/**
 * Engineering.
 *
 * The white counterpart to the machining section above it: a photograph held
 * on the left, the heading in its own hairline cell, and the disciplines set
 * side by side in one brand-blue band under it. The simulation note sits
 * below the band, in the copy column only, so the band reads as the middle of
 * the composition rather than its end.
 *
 * Everything here is layout -- no state, no scroll choreography -- so the
 * section behaves the same at every viewport and under a reduced-motion
 * preference. Below 64rem the columns stack in reading order.
 */
export function HomeEngineeringSection({ block, disciplines }: Props) {
  // Block, then an explicit prop, then the committed defaults.
  const cells = block?.disciplines?.length
    ? block.disciplines
    : (disciplines ?? defaultHomeEngineeringDisciplines)
  const intro = {
    code: block?.code || defaultHomeEngineeringIntro.code,
    heading: block?.heading || defaultHomeEngineeringIntro.heading,
  }
  const image = block?.image ?? defaultEngineeringImage
  const note = block?.note ?? defaultHomeEngineeringNote

  if (cells.length === 0) return null

  return (
    <section
      aria-labelledby="engineering-title"
      className="engineering"
      data-nav-surface="white"
      data-responsive-layout="engineering"
      id="engineering"
    >
      <div className="engineering-inner">
        {/*
         * Deliberately not a Reveal for now. Wrapped in `motion="shutter"`
         * the figure stayed on its hidden frame -- clip-path: inset(100% 0 0)
         * and scale 1.04 -- however far it was scrolled into view, so the
         * photograph never appeared at all. The sibling `rise` reveals on this
         * section do play, so it is the shutter variant rather than the
         * viewport trigger; wrap it again once that is sorted.
         */}
        <figure className="engineering-media">
          <SafeImg
            alt={image.alt}
            className="engineering-media-image"
            loading="lazy"
            src={image.url}
          />
        </figure>

        <Reveal as="header" className="engineering-head">
          <h2 className="engineering-title" id="engineering-title">
            {intro.heading}
          </h2>
        </Reveal>

        <RevealGroup className="engineering-disciplines" stagger={0.1}>
          {cells.map((discipline) => (
            <RevealItem as="article" className="engineering-discipline" key={discipline.id}>
              <p className="engineering-discipline-eyebrow">{discipline.eyebrow}</p>
              <h3 className="engineering-discipline-title" id={`engineering-${discipline.id}`}>
                {discipline.title}
              </h3>
              {/*
               * Copy is bottom-aligned within the cell so the two lists start
               * on the same line even where one discipline carries a leading
               * paragraph and the other does not, as in the design.
               */}
              <div className="engineering-discipline-copy">
                {discipline.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <DisciplineList items={discipline.items} lead={discipline.listLead} />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="engineering-note">
          {note.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <DisciplineList
            items={note.items}
            lead={note.listLead}
          />
        </Reveal>
      </div>
    </section>
  )
}
