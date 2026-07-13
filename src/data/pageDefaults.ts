import type { PageLayout } from './pages'

export const capabilitiesLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Capabilities',
    heading: 'Manufacturing capability under one roof.',
    description:
      'A scalable view of Sky Wings processes, machines, outputs, and future production capacity.',
    primaryLabel: 'Request a quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
  },
  {
    blockType: 'capabilityListing',
    eyebrow: 'Process map',
    heading: 'From CNC machining to surface treatment.',
    description:
      'Each capability can connect to machines, materials, typical outputs, product families, and brochures.',
  },
]

export const industriesLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Industries',
    heading: 'Buyer paths for every sector Sky Wings serves.',
    description:
      'Browse industry views for construction, infrastructure, industrial manufacturing, architecture, aviation, marine, and commercial work.',
    primaryLabel: 'Explore products',
    primaryHref: '/products',
    secondaryLabel: 'Request a quote',
    secondaryHref: '/contact',
  },
  {
    blockType: 'industryListing',
    eyebrow: 'Market views',
    heading: 'Products and capabilities organized by use case.',
    description:
      'Each industry can collect pain points, solutions, product families, brochures, and case studies.',
  },
]

export const productsLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Products',
    heading: 'A shop-like product catalogue for engineered metal products.',
    description:
      'Filter by industry, family, or product type, then open a product to inspect specs, related brochures, 3D assets, and RFQ options.',
    primaryLabel: 'Request custom product',
    primaryHref: '/contact',
    secondaryLabel: 'Download brochures',
    secondaryHref: '/brochures',
  },
  {
    blockType: 'productListing',
    eyebrow: 'Catalogue',
    heading: 'All products, families, and configurable systems.',
    description:
      'This section is powered by the Products collection and can grow as new machines, industries, and catalogues are added.',
    showFilters: true,
  },
]

export const brochuresLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Brochures',
    heading: 'Catalogues and technical documents for buyers.',
    description:
      'Use public documents for quick browsing and lead-gated documents for higher-value technical downloads.',
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
      'Brochures are connected to products, industries, and capabilities in Payload for reusable catalogue architecture.',
  },
]

export const contactLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Contact',
    heading: 'Send a requirement and get an engineering-led response.',
    description:
      'Share a drawing, sample, product concept, repair requirement, or manufacturing problem to solve.',
    primaryLabel: 'Start RFQ',
    primaryHref: '#rfq-form',
    secondaryLabel: 'Browse products',
    secondaryHref: '/products',
  },
  {
    blockType: 'contactRFQ',
    eyebrow: 'Request quote',
    heading: 'Tell us what you need to manufacture.',
    description:
      'The form captures structured RFQ data in Payload so the team can qualify, estimate, and follow up.',
    contactEmail: 'info@skywings.ae',
    contactPhone: '+971 50 538 9979',
  },
]

export const blogLayout: PageLayout = [
  {
    blockType: 'pageHero',
    eyebrow: 'Blog',
    heading: 'Manufacturing insights, updates, and project stories.',
    description:
      'A CMS-managed publishing space for product education, industry guidance, and Sky Wings capability updates.',
    primaryLabel: 'Request a quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
  },
  {
    blockType: 'blogListing',
    eyebrow: 'Articles',
    heading: 'Latest admin-managed content.',
    description:
      'Publish updates from Payload and connect future articles to products, capabilities, and industry pages.',
  },
]
