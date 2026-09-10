import type { Faq, FAQBlock } from '@/payload-types'

import { FaqAccordion, type FaqGroup, type FaqItem } from './FaqAccordion'
import { Reveal } from './Reveal'
import { SectionShell } from './SectionShell'
import { headingId, SectionEyebrow } from './shared'

/**
 * Normalises the three ways an FAQ block can be authored (grouped questions,
 * ungrouped questions, linked FAQ records) into one list of groups, so the
 * accordion never has to know which the editor used.
 */
export function FaqSection(props: { block: FAQBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-faq')
  const groups = collectGroups(block)

  if (groups.length === 0) {
    return null
  }

  const heading = block.heading?.trim() || 'Frequently asked questions'

  return (
    <SectionShell
      anchorId={block.anchorId}
      className="industry-faq"
      labelledBy={id}
      theme={block.theme}
    >
      <Reveal className="industry-faq-head">
        <SectionEyebrow>{block.eyebrow}</SectionEyebrow>
        <h2 className="industry-faq-heading" id={id}>
          <span className="industry-heading-line">{heading}</span>
          {block.secondaryHeading ? (
            <span className="industry-heading-line industry-heading-light">
              {block.secondaryHeading}
            </span>
          ) : null}
        </h2>
      </Reveal>

      <FaqAccordion allowMultipleOpen={Boolean(block.allowMultipleOpen)} groups={groups} />
    </SectionShell>
  )
}

function collectGroups(block: FAQBlock): FaqGroup[] {
  const grouped = (block.categories ?? []).filter((category) => category.questions?.length)

  if (grouped.length > 0) {
    return grouped.map((category, index) => ({
      id: category.id ?? `category-${index}`,
      items: category.questions.map(toItem),
      label: category.label,
    }))
  }

  const inline = (block.items ?? []).map(toItem)
  const linked = (block.faqs ?? [])
    .filter((faq): faq is Faq => typeof faq === 'object' && faq !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((faq, index) => ({
      answer: faq.answer,
      category: faq.category?.trim() || null,
      defaultOpen: false,
      id: `faq-${faq.id ?? index}`,
      question: faq.question,
    }))

  const items = [...inline, ...linked]

  if (items.length === 0) {
    return []
  }

  const categories = new Map<null | string, FaqItem[]>()
  items.forEach((item) => {
    const bucket = categories.get(item.category) ?? []
    bucket.push(item)
    categories.set(item.category, bucket)
  })

  return [...categories.entries()].map(([label, groupItems], index) => ({
    id: `group-${index}`,
    items: groupItems,
    label,
  }))
}

function toItem(
  entry: {
    answer: FaqItem['answer']
    defaultOpen?: boolean | null
    id?: null | string
    question: string
  },
  index: number,
): FaqItem {
  return {
    answer: entry.answer,
    category: null,
    defaultOpen: Boolean(entry.defaultOpen),
    id: entry.id ?? `question-${index}`,
    question: entry.question,
  }
}
