import type { SiteFooterData } from '@/data/site'

export function SiteFooter(props: { footer: SiteFooterData }) {
  const { footer } = props

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>Sky Wings Engineering Industries LLC</strong>
        <p>{footer.tagline}</p>
      </div>
      <div className="footer-groups">
        {footer.linkGroups.map((group) => (
          <nav aria-label={group.heading} className="footer-group" key={group.id ?? group.heading}>
            <strong>{group.heading}</strong>
            {group.links?.map((link) => (
              <a href={link.href} key={link.id ?? link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <p className="footer-copyright">{footer.copyright}</p>
    </footer>
  )
}
