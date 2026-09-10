import type { Footer, Header, Media, SiteSetting } from '@/payload-types'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { cachedQuery } from './cache'
import { getMediaImage, type MediaImage as MediaImageData } from './media'
import { industryRank } from './productTaxonomy'
import { getProductNavigation, type ProductNavigationItem } from './catalog'
import { getIndustryNavigation, type IndustryNavigationItem } from './industryPages'
import { getPayloadClient } from './payload'
import { TAGS } from './tags'

type StoredHeaderNavigationItem = NonNullable<Header['navigation']>[number]
type StoredHeaderNavigationChild = NonNullable<StoredHeaderNavigationItem['children']>[number]

/**
 * The Header global lets editors author two levels. The generated Products
 * menu needs a third (industry -> family), so the rendered shape widens the
 * stored one rather than adding a nested array -- and a DB migration -- for a
 * level nobody hand-authors.
 */
export type HeaderNavigationChild = StoredHeaderNavigationChild & {
  children?: { href: string; id?: string | null; label: string }[] | null
}

export type HeaderNavigationItem = Omit<StoredHeaderNavigationItem, 'children'> & {
  children?: HeaderNavigationChild[] | null
}
export type HeaderCTA = NonNullable<Header['cta']>[number]
export type FooterLinkGroup = NonNullable<Footer['linkGroups']>[number]
export type FooterAddress = NonNullable<Footer['addresses']>[number]
export type FooterLegalLink = NonNullable<Footer['legalLinks']>[number]

export type SiteHeaderData = {
  brandName: string
  brandTagline: string
  logo?: Media | null
  /** Compact mark for the scrolled bar; null falls back to a scaled logo. */
  logoSymbol?: Media | null
  navigation: HeaderNavigationItem[]
  cta?: HeaderCTA | null
}

export type SiteFooterData = {
  addresses: FooterAddress[]
  copyright: string
  emailAddress: string
  emailLabel: string
  headline: string
  legalLinks: FooterLegalLink[]
  /** Home locations photograph; null falls back to the committed image. */
  locationsImage?: MediaImageData | null
  linkGroups: FooterLinkGroup[]
  newsletterButtonLabel: string
  newsletterHeading: string
  newsletterPlaceholder: string
  newsletterPrivacyLinks: FooterLegalLink[]
  newsletterPrivacyText: string
  phoneLabel: string
  phoneNumbers: string[]
}

export type SiteMetadataData = {
  description: string
  faviconHref: string
  title: string
}

const industryNavigationChildren: NonNullable<HeaderNavigationItem['children']> = [
  { label: 'Construction & Infrastructure', href: '/industries' },
  { label: 'Aviation Ground Support Equipment', href: '/industries' },
  { label: 'Heavy Equipment & Machinery', href: '/industries' },
  { label: 'Architectural & Interior Metalwork', href: '/industries' },
  { label: 'Industrial Manufacturing', href: '/industries' },
  { label: 'Custom Metal Fabrication', href: '/industries' },
]

export const defaultHeaderData: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  navigation: [
    {
      label: 'Industries',
      href: '/industries',
      children: industryNavigationChildren,
    },
    { label: 'Products', href: '/products' },
    { label: 'Configurators', href: '/#configurators' },
    { label: 'Capabilities', href: '/capabilities' },
    { label: 'Resources', href: '/brochures' },
    { label: 'About', href: '/#about' },
  ],
  cta: {
    label: 'Request Quote',
    href: '/contact',
    style: 'primary',
    openInNewTab: false,
  },
}

export const defaultFooterData: SiteFooterData = {
  addresses: [
    {
      address: 'A2, Plot No. 10576 015-3, Sajja Industrial Area, Sharjah, UAE',
      phone: '+971 509 469 979',
    },
    {
      address: 'Plot No. D-81, Thoban Industrial Area, Fujairah, UAE',
      phone: '+971 505 389 979',
    },
  ],
  copyright: `© ${new Date().getFullYear()} Skywings. All rights reserved.`,
  emailAddress: 'info@skywings.ae',
  emailLabel: 'Send email',
  headline: 'Skywings',
  locationsImage: null,
  legalLinks: [
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
  linkGroups: [
    {
      heading: 'Explore products and resources',
      links: [
        { label: 'Products', href: '/products' },
        { label: 'Industries', href: '/industries' },
        { label: 'Resources', href: '/brochures' },
        { label: 'Guides', href: '/brochures' },
        { label: 'Blogs', href: '/blog' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '/#about' },
        { label: 'Our Machines', href: '/products' },
        { label: 'Career', href: '/careers' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
  newsletterButtonLabel: 'Subscribe',
  newsletterHeading: 'Subscribe to get the latest news of our products in your inbox',
  newsletterPlaceholder: 'Enter your email address',
  newsletterPrivacyLinks: [
    { label: 'Privacy Policy', href: 'https://policies.google.com/privacy' },
    { label: 'Terms of Service', href: 'https://policies.google.com/terms' },
  ],
  newsletterPrivacyText:
    'The privacy policy is available at the following {privacyLink}\nThe site is protected by reCAPTCHA and Google {googlePrivacy} and {terms} apply',
  phoneLabel: 'Call now',
  phoneNumbers: ['06 883 8036', '+971 54 242 9624', '+971 50 946 9979', '+971 50 538 9979'],
}

export const defaultSiteMetadata: SiteMetadataData = {
  description:
    'Sky Wings Engineering Industries LLC provides end-to-end metal manufacturing for construction, industrial, architectural, aviation, and marine sectors.',
  faviconHref: '/favicon.png',
  title: 'Sky Wings Engineering Industries LLC',
}

function getMedia(value: SiteSetting['logo'] | SiteSetting['favicon']): Media | null {
  return typeof value === 'object' && value ? value : null
}

function hasLocalMediaFile(url: string): boolean {
  const localMediaPrefix = '/api/media/file/'

  if (!url.startsWith(localMediaPrefix)) {
    return true
  }

  const filename = decodeURIComponent(url.slice(localMediaPrefix.length))
  const localFilePath = path.join(process.cwd(), 'media', filename)

  return existsSync(localFilePath)
}

export function getResolvableMedia(
  value: SiteSetting['logo'] | SiteSetting['favicon'],
): Media | null {
  const media = getMedia(value)

  return media?.url && hasLocalMediaFile(media.url) ? media : null
}

function getResolvableFaviconHref(media: Media | null): string {
  if (!media?.url) {
    return defaultSiteMetadata.faviconHref
  }

  if (hasLocalMediaFile(media.url)) {
    return media.url
  }

  return defaultSiteMetadata.faviconHref
}

/**
 * Fills the generated dropdowns. Precedence in both cases: an explicit
 * multi-item list in the Header global wins (editors can hand-curate), then
 * live content, then a hardcoded fallback so the menu never renders empty.
 *
 * Products nests two deep -- industry, then the product families focused on
 * it -- so the panel doubles as a category map rather than a flat link list.
 */
/**
 * Aviation leads the Industries menu as it leads every other listing.
 *
 * Applied by slug rather than by position, and to a hand-curated list as well
 * as a generated one: the priority is a standing decision about the range, so
 * it should not depend on an editor remembering to drag one row to the top.
 * Everything else keeps the order it arrived in.
 */
function sortIndustryChildren(children: HeaderNavigationChild[]): HeaderNavigationChild[] {
  const slugOf = (href: string) => href.split('/industries/')[1]?.split(/[?#]/)[0] ?? ''

  return [...children].sort((a, b) => industryRank(slugOf(a.href)) - industryRank(slugOf(b.href)))
}

function normalizeHeaderNavigation(
  navigation: HeaderNavigationItem[],
  industryPages: IndustryNavigationItem[],
  productCategories: ProductNavigationItem[],
): HeaderNavigationItem[] {
  return navigation.map((item) => {
    const label = item.label.trim().toLowerCase()

    // A hand-curated list in the CMS always wins over generated children --
    // except for its order, which the priority above still settles.
    if ((item.children?.length ?? 0) > 1) {
      return label === 'industries'
        ? { ...item, children: sortIndustryChildren(item.children ?? []) }
        : item
    }

    if (label === 'industries') {
      return {
        ...item,
        children: sortIndustryChildren(
          industryPages.length
            ? industryPages.map(({ href, label: childLabel }) => ({ href, label: childLabel }))
            : industryNavigationChildren,
        ),
      }
    }

    if (label === 'products' && productCategories.length) {
      return { ...item, children: productCategories }
    }

    return item
  })
}

async function fetchSiteHeader(): Promise<SiteHeaderData> {
  const payload = await getPayloadClient()
  const [header, siteSettings, industryPages, productCategories] = await Promise.all([
    payload.findGlobal({
      slug: 'header',
      depth: 1,
      overrideAccess: false,
    }),
    payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
      overrideAccess: false,
    }),
    getIndustryNavigation(),
    getProductNavigation(),
  ])

  return {
    ...defaultHeaderData,
    logo: getResolvableMedia(siteSettings.logo),
    logoSymbol: getResolvableMedia(siteSettings.logoSymbol),
    navigation: normalizeHeaderNavigation(
      header.navigation?.length ? header.navigation : defaultHeaderData.navigation,
      industryPages,
      productCategories,
    ),
    cta: header.cta?.[0] ?? defaultHeaderData.cta,
  }
}

const getCachedSiteHeader = cachedQuery(
  fetchSiteHeader,
  ['site-header'],
  [TAGS.globals, TAGS.media, TAGS.industryPages, TAGS.products, TAGS.industries],
)

export async function getSiteHeader(): Promise<SiteHeaderData> {
  try {
    return await getCachedSiteHeader()
  } catch (error) {
    console.error('Unable to load Payload header global', error)

    return defaultHeaderData
  }
}

async function fetchSiteFooter(): Promise<SiteFooterData> {
  const payload = await getPayloadClient()
  const footer = await payload.findGlobal({
    slug: 'footer',
    depth: 1,
    overrideAccess: false,
  })

  return {
    addresses: footer.addresses?.length ? footer.addresses : defaultFooterData.addresses,
    copyright: footer.copyright || defaultFooterData.copyright,
    emailAddress: footer.emailAddress || defaultFooterData.emailAddress,
    emailLabel: footer.emailLabel || defaultFooterData.emailLabel,
    headline: footer.headline || defaultFooterData.headline,
    legalLinks: footer.legalLinks?.length ? footer.legalLinks : defaultFooterData.legalLinks,
    // Stored under the column the retired delivery section created.
    locationsImage: getMediaImage(footer.deliveryImage),
    linkGroups: footer.linkGroups?.length ? footer.linkGroups : defaultFooterData.linkGroups,
    newsletterButtonLabel: footer.newsletterButtonLabel || defaultFooterData.newsletterButtonLabel,
    newsletterHeading: footer.newsletterHeading || defaultFooterData.newsletterHeading,
    newsletterPlaceholder: footer.newsletterPlaceholder || defaultFooterData.newsletterPlaceholder,
    newsletterPrivacyLinks: footer.newsletterPrivacyLinks?.length
      ? footer.newsletterPrivacyLinks
      : defaultFooterData.newsletterPrivacyLinks,
    newsletterPrivacyText: footer.newsletterPrivacyText || defaultFooterData.newsletterPrivacyText,
    phoneLabel: footer.phoneLabel || defaultFooterData.phoneLabel,
    phoneNumbers: footer.phoneNumbers?.length
      ? footer.phoneNumbers.map(({ number }) => number)
      : defaultFooterData.phoneNumbers,
  }
}

const getCachedSiteFooter = cachedQuery(
  fetchSiteFooter,
  ['site-footer'],
  [TAGS.globals, TAGS.media],
)

export async function getSiteFooter(): Promise<SiteFooterData> {
  try {
    return await getCachedSiteFooter()
  } catch (error) {
    console.error('Unable to load Payload footer global', error)

    return defaultFooterData
  }
}

async function fetchSiteMetadata(): Promise<SiteMetadataData> {
  const payload = await getPayloadClient()

  const [siteSettings, seoDefaults] = await Promise.all([
    payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
      overrideAccess: false,
    }),
    payload.findGlobal({
      slug: 'seo-defaults',
      depth: 1,
      overrideAccess: false,
    }),
  ])

  const favicon = getMedia(siteSettings.favicon)

  return {
    description:
      seoDefaults.defaultDescription || siteSettings.tagline || defaultSiteMetadata.description,
    faviconHref: getResolvableFaviconHref(favicon),
    title: seoDefaults.defaultTitle || siteSettings.siteName || defaultSiteMetadata.title,
  }
}

const getCachedSiteMetadata = cachedQuery(
  fetchSiteMetadata,
  ['site-metadata'],
  [TAGS.globals, TAGS.media],
)

export async function getSiteMetadata(): Promise<SiteMetadataData> {
  try {
    return await getCachedSiteMetadata()
  } catch (error) {
    console.error('Unable to load Payload site metadata', error)

    return defaultSiteMetadata
  }
}
