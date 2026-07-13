import type { ReactNode } from 'react'

type ButtonLinkProps = {
  children: ReactNode
  href: string
  openInNewTab?: boolean | null
  variant?: 'primary' | 'secondary' | 'text' | null
}

export function ButtonLink(props: ButtonLinkProps) {
  const { children, href, openInNewTab, variant = 'primary' } = props
  const targetProps = openInNewTab ? { rel: 'noreferrer', target: '_blank' } : {}
  const className = `button button-${variant || 'primary'}`

  return (
    <a className={className} href={href} {...targetProps}>
      {children}
    </a>
  )
}
