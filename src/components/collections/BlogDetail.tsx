import { ButtonLink } from '@/components/atoms/ButtonLink'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import type { BlogPost } from '@/payload-types'

function extractLexicalText(content: BlogPost['content']) {
  const children = content?.root?.children ?? []

  return children
    .flatMap((child) => {
      const nested = Array.isArray(child.children) ? child.children : []

      return nested.map((item) => (typeof item.text === 'string' ? item.text : '')).filter(Boolean)
    })
    .join('\n\n')
}

export function BlogDetail(props: { post: BlogPost }) {
  const { post } = props
  const body = extractLexicalText(post.content)

  return (
    <>
      <section className="page-hero">
        <SectionHeading description={post.excerpt} eyebrow="Article" heading={post.title} wide />
        <ButtonLink href="/blog" variant="secondary">
          Back to blog
        </ButtonLink>
      </section>
      <article className="article-detail">
        {body ? (
          body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        ) : (
          <p>Article content is managed in Payload rich text.</p>
        )}
      </article>
    </>
  )
}
