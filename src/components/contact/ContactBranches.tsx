import type { SiteFooterData } from '@/data/site'

import { MapLines, MapPin } from './contact-art'
import { telHref } from './tel'

/**
 * Display titles for the footer's address entries. The Footer global stores
 * only { address, phone }, so titles live here (adding CMS fields would need a
 * schema push). Any address beyond the known two falls back to "Branch NN".
 */
const BRANCH_TITLES = ['Sharjah Branch', 'Thoban Branch']

function branchTitle(index: number) {
  return BRANCH_TITLES[index] ?? `Branch ${String(index + 1).padStart(2, '0')}`
}

export function ContactBranches(props: { footer: SiteFooterData }) {
  const { addresses } = props.footer

  if (!addresses.length) {
    return null
  }

  return (
    <div className="contact-branches">
      <MapLines className="contact-map-lines" />
      <div className="contact-branches-inner">
        <ol className="contact-branch-list" role="list">
          {addresses.map((branch, index) => (
            <li className="contact-branch-card" key={branch.id ?? `${branch.address}-${index}`}>
              <p className="contact-branch-code">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="contact-branch-title">{branchTitle(index)}</h3>
              <address className="contact-branch-address">{branch.address}</address>
              {branch.phone ? (
                <a className="contact-branch-phone" href={telHref(branch.phone)}>
                  {branch.phone}
                </a>
              ) : null}
            </li>
          ))}
        </ol>

        <div aria-hidden="true" className="contact-map-pins">
          {addresses.slice(0, 2).map((branch, index) => (
            <span className="contact-pin" data-pin={index} key={branch.id ?? index}>
              <MapPin />
              <span className="contact-pin-label">{branchTitle(index).split(' ')[0]}</span>
            </span>
          ))}
        </div>

        <p aria-hidden="true" className="contact-uae">
          UAE
        </p>
      </div>
    </div>
  )
}
