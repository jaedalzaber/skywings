import type { Footer, Header, Media, SiteSetting } from '@/payload-types'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { cachedQuery } from './cache'
import { getMediaImage, type MediaImage as MediaImageData } from './media'
import { industryRank } from './productTaxonomy'
import { getPayloadClient } from './payload'
import { relationSlug } from './relations'
import { TAGS } from './tags'

type StoredHeaderNavigationItem = NonNullable<Header['navigation']>[number]
type StoredHeaderNavigationChild = NonNullable<StoredHeaderNavigationItem['children']>[number]
type StoredHeaderNavigationLink = NonNullable<StoredHeaderNavigationChild['links']>[number]

/**
 * A row of the bar as the bar needs it, which is not quite as it is stored.
 * An editor picks between typing an address and choosing a shelf of the
 * catalogue, and marks rows to be greyed out or left out; by the time one
 * reaches a component all of that is settled, so it carries an address that
 * is always there and one flag saying whether it leads anywhere.
 */
export type HeaderNavigationLink = {
  /** Shown, but inert: either the editor said so or it points nowhere. */
  disabled: boolean
  href: string
  id?: string | null
  label: string
}

export type HeaderNavigationChild = HeaderNavigationLink & {
  children?: HeaderNavigationLink[] | null
}

export type HeaderNavigationItem = HeaderNavigationLink & {
  children?: HeaderNavigationChild[] | null
}

/** A row that works and is shown: what everything is unless said otherwise. */
function link(label: string, href: string): HeaderNavigationLink {
  return { disabled: false, href, label }
}
export type HeaderCTA = NonNullable<Header['cta']>[number]
export type FooterLinkGroup = NonNullable<Footer['linkGroups']>[number]
export type FooterAddress = NonNullable<Footer['addresses']>[number]
export type FooterLegalLink = NonNullable<Footer['legalLinks']>[number]

/**
 * How the mark behaves in the bar: one turn every so often, eased both ends.
 * Edited under Site Settings; see BrandLogoSpin for the animation itself.
 */
export type BrandLogoMotion = {
  durationMs: number
  /** 0 turns at one speed; 1 eases hard at both ends. */
  easeAmount: number
  enabled: boolean
  /** How deep the turn reads; the perspective on the mark's parent, in rem. */
  perspectiveRem: number
  restMs: number
}

export type SiteHeaderData = {
  brandName: string
  brandTagline: string
  logo?: Media | null
  logoMotion: BrandLogoMotion
  /** Compact mark for the scrolled bar; null falls back to a scaled logo. */
  logoSymbol?: Media | null
  navigation: HeaderNavigationItem[]
  /** Whether the Proud of UAE badge sits beside the call to action. */
  proudBadge: boolean
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

const industryNavigationChildren: HeaderNavigationChild[] = [
  link('Construction & Infrastructure', '/industries'),
  link('Aviation Ground Support Equipment', '/industries'),
  link('Heavy Equipment & Machinery', '/industries'),
  link('Architectural & Interior Metalwork', '/industries'),
  link('Industrial Manufacturing', '/industries'),
  link('Sheet Metal Fabrication', '/industries'),
]

export const defaultBrandLogoMotion: BrandLogoMotion = {
  durationMs: 1600,
  easeAmount: 0.65,
  enabled: true,
  perspectiveRem: 34,
  restMs: 9000,
}

export const defaultHeaderData: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  logoMotion: defaultBrandLogoMotion,
  navigation: [
    { ...link('Industries', '/industries'), children: industryNavigationChildren },
    link('Products', '/products'),
    link('Capabilities', '/capabilities'),
    link('Resources', '/resources'),
  ],
  proudBadge: true,
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
        { label: 'Resources', href: '/resources' },
        { label: 'Guides', href: '/resources?category=guides' },
        { label: 'Brochures', href: '/brochures' },
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

/*
 * Seconds in the admin, milliseconds in the browser. A blank field takes the
 * committed default rather than zero, which would spin without pause.
 */
function brandLogoMotion(value: SiteSetting['logoMotion']): BrandLogoMotion {
  const seconds = (input: unknown, fallbackMs: number) =>
    typeof input === 'number' && Number.isFinite(input) && input > 0
      ? Math.round(input * 1000)
      : fallbackMs

  const depth = value?.perspectiveRem
  const ease = value?.easeAmount

  return {
    durationMs: seconds(value?.durationSeconds, defaultBrandLogoMotion.durationMs),
    // 0 and 1 are both meaningful, so only a missing value takes the default.
    easeAmount:
      typeof ease === 'number' && Number.isFinite(ease)
        ? Math.min(1, Math.max(0, ease))
        : defaultBrandLogoMotion.easeAmount,
    enabled: value?.enabled !== false,
    perspectiveRem:
      typeof depth === 'number' && Number.isFinite(depth) && depth > 0
        ? depth
        : defaultBrandLogoMotion.perspectiveRem,
    restMs: seconds(value?.restSeconds, defaultBrandLogoMotion.restMs),
  }
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
  // The marker stops Turbopack tracing ./media into every route that shows
  // the logo; see readUploadDirFile in the Cloudinary adapter.
  const localFilePath = path.join(/* turbopackIgnore: true */ process.cwd(), 'media', filename)

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

type StoredNavigationRow =
  StoredHeaderNavigationItem | StoredHeaderNavigationChild | StoredHeaderNavigationLink

/**
 * Where a row points. An editor either types an address or picks a shelf of
 * the catalogue -- an industry, and optionally one family within it -- and
 * the shelf is spelled as a filtered catalogue address, the same one the
 * generated Products menu uses. A row pointing nowhere yet resolves to '#',
 * which reads below as a row that cannot be followed.
 */
function navigationHref(row: StoredNavigationRow): string {
  if (row.linkType === 'productCategory') {
    const query = [
      relationSlug(row.industry) ? `industry=${relationSlug(row.industry)}` : '',
      relationSlug(row.family) ? `family=${relationSlug(row.family)}` : '',
    ].filter(Boolean)

    return query.length ? `/products?${query.join('&')}` : '#'
  }

  return row.href?.trim() || '#'
}

/*
 * A row the bar shows but will not follow. The editor's own switch is one way
 * in; the others are rows that were never given anywhere to go -- including
 * an Industries row left at the site root, which is the shape the menu takes
 * when its children carry the links and the parent is only a heading.
 */
function isFollowable(label: string, href: string) {
  return href !== '#' && !(href === '/' && label.trim().toLowerCase() === 'industries')
}

function renderableLink(row: StoredNavigationRow): HeaderNavigationLink {
  const href = navigationHref(row)

  return {
    disabled: Boolean(row.disabled) || !isFollowable(row.label, href),
    href,
    id: row.id,
    label: row.label,
  }
}

/** Hidden rows are dropped here, so nothing downstream has to know of them. */
const isShown = (row: { hidden?: boolean | null }) => !row.hidden

export function renderableNavigation(
  navigation: NonNullable<Header['navigation']>,
): HeaderNavigationItem[] {
  return navigation.filter(isShown).map((item) => ({
    ...renderableLink(item),
    children: (item.children ?? []).filter(isShown).map((child) => ({
      ...renderableLink(child),
      children: (child.links ?? []).filter(isShown).map(renderableLink),
    })),
  }))
}

/*
 * The menus are the Header global's, whole. The bar used to build Industries
 * from the Industry Pages collection and Products from Industries x Product
 * Families, and threw away whatever an editor had written in their place --
 * so the admin screen and the bar showed different things and there was no
 * way to tell from the CMS which. The catalogue is copied into the global
 * instead, by scripts/seed-header-menus.ts, and edited there from then on.
 *
 * The one thing still settled here is the order of the Industries menu, which
 * is a standing decision about the range rather than a layout preference.
 */
function normalizeHeaderNavigation(navigation: HeaderNavigationItem[]): HeaderNavigationItem[] {
  return navigation.map((item) =>
    item.label.trim().toLowerCase() === 'industries'
      ? { ...item, children: sortIndustryChildren(item.children ?? []) }
      : item,
  )
}

async function fetchSiteHeader(): Promise<SiteHeaderData> {
  const payload = await getPayloadClient()
  const [header, siteSettings] = await Promise.all([
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
  ])

  return {
    ...defaultHeaderData,
    logo: getResolvableMedia(siteSettings.logo),
    logoMotion: brandLogoMotion(siteSettings.logoMotion),
    logoSymbol: getResolvableMedia(siteSettings.logoSymbol),
    navigation: normalizeHeaderNavigation(
      header.navigation?.length
        ? renderableNavigation(header.navigation)
        : defaultHeaderData.navigation,
    ),
    proudBadge: header.showProudBadge ?? defaultHeaderData.proudBadge,
    cta: header.cta?.[0] ?? defaultHeaderData.cta,
  }
}

const getCachedSiteHeader = cachedQuery(
  fetchSiteHeader,
  // v5: the menus are the Header global's own, so nothing here follows the
  // catalogue any more -- only the global and the logo it names.
  ['site-header', 'cms-menus-v5'],
  [TAGS.globals, TAGS.media],
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
