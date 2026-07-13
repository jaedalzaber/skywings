import type { Footer, Header, Media, SiteSetting } from '@/payload-types'

import { getPayloadClient } from './payload'

export type HeaderNavigationItem = NonNullable<Header['navigation']>[number]
export type HeaderCTA = NonNullable<Header['cta']>[number]
export type FooterLinkGroup = NonNullable<Footer['linkGroups']>[number]

export type SiteHeaderData = {
  brandName: string
  brandTagline: string
  logo?: Media | null
  navigation: HeaderNavigationItem[]
  cta?: HeaderCTA | null
}

export type SiteFooterData = {
  copyright: string
  linkGroups: FooterLinkGroup[]
  logo?: Media | null
  tagline: string
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
  copyright: `(c) ${new Date().getFullYear()} Sky Wings Engineering Industries LLC`,
  linkGroups: [
    {
      heading: 'Explore',
      links: [
        { label: 'Capabilities', href: '/capabilities' },
        { label: 'Industries', href: '/industries' },
        { label: 'Products', href: '/products' },
        { label: 'Brochures', href: '/brochures' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Request Quote', href: '/contact' },
      ],
    },
  ],
  tagline:
    'End-to-end metal manufacturing for construction, infrastructure, industrial, architecture, aviation, and marine sectors.',
}

export const defaultSiteMetadata: SiteMetadataData = {
  description:
    'Sky Wings Engineering Industries LLC provides end-to-end metal manufacturing for construction, industrial, architectural, aviation, and marine sectors.',
  faviconHref: '/favicon.png',
  title: 'Sky Wings Engineering Industries LLC',
}

function getMedia(value: Footer['logo'] | Header['logo'] | SiteSetting['favicon']): Media | null {
  return typeof value === 'object' && value ? value : null
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
      copyright: footer.copyright || defaultFooterData.copyright,
      linkGroups: footer.linkGroups?.length ? footer.linkGroups : defaultFooterData.linkGroups,
      logo: getMedia(footer.logo),
      tagline: footer.tagline || defaultFooterData.tagline,
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
      faviconHref: favicon?.url || defaultSiteMetadata.faviconHref,
      title: seoDefaults.defaultTitle || siteSettings.siteName || defaultSiteMetadata.title,
    }
  } catch (error) {
    console.error('Unable to load Payload site metadata', error)

    return defaultSiteMetadata
  }
}
