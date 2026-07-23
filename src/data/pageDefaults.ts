import type { PageLayout } from './pages'

export const capabilitiesLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Capabilities',
    heading: 'Manufacturing capability under one accountable team.',
    description:
      'See how Sky Wings combines machining, sheet metal, pipe bending, fabrication, welding, finishing, and assembly to deliver custom metalwork at project scale.',
    primaryLabel: 'Request a quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
  },
  {
    blockType: 'capabilityListing',
    eyebrow: 'Process map',
    heading: 'From CNC machining to finished assemblies.',
    description:
      'Choose the process you need, compare typical outputs, and start a quote with the right technical context.',
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
    eyebrow: 'Contact Us',
    heading: 'Feel Free To Get In Touch With Us.',
    description:
      'Supported by modern machinery and experienced technicians, we deliver customized fabrication solutions.',
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
