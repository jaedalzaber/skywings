import type { RichTextBlock } from '@/payload-types'

import { RichText, richTextIsEmpty } from '@/components/atoms/RichText'

import { SectionShell } from './SectionShell'

export function RichTextSection(props: { block: RichTextBlock }) {
  const { block } = props

  if (richTextIsEmpty(block.content)) {
    return null
  }

  return (
    <SectionShell className="industry-richtext" theme="light">
      <RichText className="industry-prose" value={block.content} />
    </SectionShell>
  )
}
