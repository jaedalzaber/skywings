import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * The frame for the newsletter's own pages -- confirm and preferences -- in
 * the site's white hairline language: a mono eyebrow in blue, a plain title,
 * and the content in one bordered cell at a readable width.
 */
export function NewsletterPanel(props: {
  children?: ReactNode
  eyebrow?: string
  title: string
  tone?: 'error' | 'neutral' | 'success'
}) {
  return (
    <section
      aria-labelledby="newsletter-title"
      className="newsletter-page"
      data-nav-surface="white"
      data-tone={props.tone ?? 'neutral'}
    >
      <div className="newsletter-panel">
        <p className="newsletter-eyebrow">{props.eyebrow ?? 'Newsletter'}</p>
        <h1 className="newsletter-title" id="newsletter-title">
          {props.title}
        </h1>
        {props.children}
        <p className="newsletter-home">
          <Link href="/">Back to the website</Link>
        </p>
      </div>
    </section>
  )
}
