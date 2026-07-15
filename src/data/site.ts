import type { Footer, Header, Media, SiteSetting } from '@/payload-types'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { getPayloadClient } from './payload'

export type HeaderNavigationItem = NonNullable<Header['navigation']>[number]
export type HeaderCTA = NonNullable<Header['cta']>[number]
export type FooterLinkGroup = NonNullable<Footer['linkGroups']>[number]
export type FooterAddress = NonNullable<Footer['addresses']>[number]
export type FooterLegalLink = NonNullable<Footer['legalLinks']>[number]

export type SiteHeaderData = {
  brandName: string
  brandTagline: string
  logo?: Media | null
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

export const defaultHeaderData: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  navigation: [
    {
      label: 'Industries',
      href: '/industries',
      children: [{ label: 'Aviation Ground Support Equipment', href: '/industries' }],
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
  headline: 'Let’s talk',
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
    'The privacy policy is available at the following link. The site is protected by reCAPTCHA and Google policies apply.',
  phoneLabel: 'Call now',
  phoneNumbers: ['06 883 8036', '+971 54 242 9624', '+971 50 946 9979', '+971 50 538 9979'],
}

export const defaultSiteMetadata: SiteMetadataData = {
  description:
    'Sky Wings Engineering Industries LLC provides end-to-end metal manufacturing for construction, industrial, architectural, aviation, and marine sectors.',
  faviconHref: '/favicon.png',
  title: 'Sky Wings Engineering Industries LLC',
}

function getMedia(value: Header['logo'] | SiteSetting['favicon']): Media | null {
  return typeof value === 'object' && value ? value : null
}

function getResolvableFaviconHref(media: Media | null): string {
  if (!media?.url) {
    return defaultSiteMetadata.faviconHref
  }

  const localMediaPrefix = '/api/media/file/'

  if (!media.url.startsWith(localMediaPrefix)) {
    return media.url
  }

  const filename = decodeURIComponent(media.url.slice(localMediaPrefix.length))
  const localFilePath = path.join(process.cwd(), 'media', filename)

  return existsSync(localFilePath) ? media.url : defaultSiteMetadata.faviconHref
}

export async function getSiteHeader(): Promise<SiteHeaderData> {
  try {
    const payload = await getPayloadClient()
    const header = await payload.findGlobal({
      slug: 'header',
      depth: 1,
      overrideAccess: false,
    })

    return {
      ...defaultHeaderData,
      logo: getMedia(header.logo),
      navigation: header.navigation?.length ? header.navigation : defaultHeaderData.navigation,
      cta: header.cta?.[0] ?? defaultHeaderData.cta,
    }
  } catch (error) {
    console.error('Unable to load Payload header global', error)

    return defaultHeaderData
  }
}

export async function getSiteFooter(): Promise<SiteFooterData> {
  try {
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
      linkGroups: footer.linkGroups?.length ? footer.linkGroups : defaultFooterData.linkGroups,
      newsletterButtonLabel:
        footer.newsletterButtonLabel || defaultFooterData.newsletterButtonLabel,
      newsletterHeading: footer.newsletterHeading || defaultFooterData.newsletterHeading,
      newsletterPlaceholder:
        footer.newsletterPlaceholder || defaultFooterData.newsletterPlaceholder,
      newsletterPrivacyLinks: footer.newsletterPrivacyLinks?.length
        ? footer.newsletterPrivacyLinks
        : defaultFooterData.newsletterPrivacyLinks,
      newsletterPrivacyText:
        footer.newsletterPrivacyText || defaultFooterData.newsletterPrivacyText,
      phoneLabel: footer.phoneLabel || defaultFooterData.phoneLabel,
      phoneNumbers: footer.phoneNumbers?.length
        ? footer.phoneNumbers.map(({ number }) => number)
        : defaultFooterData.phoneNumbers,
    }
  } catch (error) {
    console.error('Unable to load Payload footer global', error)

    return defaultFooterData
  }
}

export async function getSiteMetadata(): Promise<SiteMetadataData> {
  try {
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
  } catch (error) {
    console.error('Unable to load Payload site metadata', error)

    return defaultSiteMetadata
  }
}
