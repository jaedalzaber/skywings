import { defaultCapabilitiesCopy } from './capabilityDefaults'
import type { PageLayout } from './pages'

/*
 * The capabilities page is no longer built from these blocks -- it renders
 * ProcessCapabilities -- but it still reads its copy from them, so the
 * wording stays editable in the admin: the hero block is the page head, the
 * capability-listing block the closing band. See capabilitiesCopyFromLayout.
 */
export const capabilitiesLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: defaultCapabilitiesCopy.eyebrow,
    heading: defaultCapabilitiesCopy.heading,
    description: defaultCapabilitiesCopy.description,
    primaryLabel: defaultCapabilitiesCopy.primaryLabel,
    primaryHref: defaultCapabilitiesCopy.primaryHref,
    secondaryLabel: defaultCapabilitiesCopy.secondaryLabel,
    secondaryHref: defaultCapabilitiesCopy.secondaryHref,
  },
  {
    blockType: 'capabilityListing',
    eyebrow: 'Integrated',
    heading: defaultCapabilitiesCopy.closingHeading,
    description: defaultCapabilitiesCopy.closingStatement,
  },
]

export const industriesLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Industries',
    heading: 'Metal fabrication for demanding project environments.',
    description:
      'Find products and manufacturing capabilities for construction, infrastructure, industrial manufacturing, architecture, aviation ground support, marine, and commercial projects.',
    primaryLabel: 'Explore products',
    primaryHref: '/products',
    secondaryLabel: 'Request a quote',
    secondaryHref: '/contact',
  },
  {
    blockType: 'industryListing',
    eyebrow: 'Market views',
    heading: 'Start with your sector, then get to the right product faster.',
    description:
      'Each industry view connects relevant products, applications, brochures, and fabrication capabilities.',
  },
]

export const productsLayout: PageLayout = [
  {
    blockType: 'productListing',
    eyebrow: 'Products',
    heading: 'Engineered metal products, built to your specification.',
    showFilters: true,
  },
]

export const brochuresLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Brochures',
    heading: 'Technical catalogues for faster shortlisting.',
    description:
      'Download company, product, and capability brochures to review dimensions, applications, and manufacturing options before you request a quote.',
    primaryLabel: 'Request a quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
  },
  {
    blockType: 'brochureListing',
    eyebrow: 'Downloads',
    heading: 'Company, product, capability, and industry brochures.',
    description:
      'Pick the document that matches your requirement, then send drawings or project details when you are ready for pricing.',
  },
]

export const contactLayout: PageLayout = [
  {
    blockType: 'contactRFQ',
    eyebrow: 'Request a quote',
    heading: 'Tell us what you need to manufacture.',
    description:
      'Share drawings, sizes or just the idea. We will come back to you with options and a quote.',
  },
]

export const blogLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Blog',
    heading: 'Manufacturing insights, updates, and project stories.',
    description:
      'Read practical notes on fabricated metal products, manufacturing decisions, industry applications, and Sky Wings capability updates.',
    primaryLabel: 'Request a quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
  },
  {
    blockType: 'blogListing',
    eyebrow: 'Articles',
    heading: 'Latest articles and updates.',
    description:
      'Explore product education, project guidance, and manufacturing updates from the Sky Wings team.',
  },
]
