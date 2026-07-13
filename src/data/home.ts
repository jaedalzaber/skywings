import type { Page } from '@/payload-types'

import { getPayloadClient } from './payload'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type HomeLayout = Extract<LayoutBlock, { blockType: `home${string}` }>[]
export type HomeHeroLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeHero' }>
export type HomeCapabilitiesLayoutBlock = Extract<
  HomeLayout[number],
  { blockType: 'homeCapabilities' }
>
export type HomeIndustriesLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeIndustries' }>
export type HomeProductMapLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeProductMap' }>
export type HomeProcessLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeProcess' }>
export type HomeConfiguratorLayoutBlock = Extract<
  HomeLayout[number],
  { blockType: 'homeConfigurator' }
>

export const defaultHeroPreviewItems: NonNullable<HomeHeroLayoutBlock['previewItems']> = [
  { title: 'CNC machining' },
  { title: 'Sheet metal processing' },
  { title: 'Pipe bending' },
  { title: 'Fabrication' },
]

export const defaultHomeLayout: HomeLayout = [
  {
    blockType: 'homeHero',
    eyebrow: 'End-to-end metal manufacturing',
    heading: 'From drawing, sample, or problem to manufactured product.',
    description:
      'Sky Wings brings CNC machining, sheet metal processing, pipe bending, fabrication, welding, assembly, and surface treatment into one connected manufacturing system.',
    primaryLabel: 'Request Quote',
    primaryHref: '/contact',
    secondaryLabel: 'View product map',
    secondaryHref: '#products',
    previewHeading: 'Manufacturing under one roof',
    previewItems: defaultHeroPreviewItems,
  },
  {
    blockType: 'homeCapabilities',
    eyebrow: 'Manufacturing capability',
    heading: 'A scalable system for machines, materials, finishes, and output.',
    items: [
      { title: 'CNC machining' },
      { title: 'Sheet metal processing' },
      { title: 'Pipe bending' },
      { title: 'Fabrication' },
      { title: 'Welding and assembly' },
      { title: 'Surface treatment' },
    ].map((item) => ({
      ...item,
      description:
        'Structured in the CMS as a capability with linked machines, materials, product outputs, brochures, and case studies.',
    })),
  },
  {
    blockType: 'homeIndustries',
    eyebrow: 'Industries We Serve',
    heading: 'Metalwork Solutions Across Every Industries',
    description: 'End-to-end metal manufacturing for sector-specific products and assemblies.',
    items: [
      'Construction & Infrastructure',
      'Architectural & Interior Metalwork',
      'Heavy Equipment & Machinery',
      'Aviation Ground Support Equipment',
      'Industrial Manufacturing',
      'Marine & Offshore',
    ].map((title) => ({
      title,
      meta: 'Products, applications, related assemblies',
    })),
  },
  {
    blockType: 'homeProductMap',
    eyebrow: 'Product architecture',
    heading: 'Product families become pages, catalogue sections, and configurators.',
    items: [
      'Modular conveyor systems',
      'Maintenance platforms',
      'Frames and enclosures',
      'Railings and barriers',
      'Cargo handling equipment',
      'Custom fabricated assemblies',
    ].map((title) => ({
      title,
      description: 'Specs, materials, finishes, related machines, downloads, 3D assets.',
    })),
  },
  {
    blockType: 'homeProcess',
    eyebrow: 'Manufacturing process',
    heading: 'Our Manufacturing Process',
    steps: [
      'Client Brief',
      'Mechanical CAD Design',
      'Laser Cutting & Machining',
      'Welding & Erection',
      'Surface Painting & Finishings',
      'Final Delivery',
    ].map((title) => ({ title })),
  },
  {
    blockType: 'homeConfigurator',
    eyebrow: '3D viewer and RFQ flow',
    heading: 'Buyers can inspect, configure, and request a quote.',
    description:
      'Start with modular conveyor systems: length, width, roller type, guards, material, finish, and application. Every choice can be captured as structured RFQ data in Payload.',
    ctaLabel: 'Send enquiry',
    ctaHref: 'mailto:info@skywings.ae',
  },
]

export function isHomeBlock(block: LayoutBlock): block is HomeLayout[number] {
  return block.blockType.startsWith('home')
}

export async function getHomeLayout(): Promise<HomeLayout> {
  try {
    const payload = await getPayloadClient()

    const { docs } = await payload.find({
      collection: 'pages',
      depth: 1,
      draft: false,
      limit: 1,
      overrideAccess: false,
      where: {
        slug: {
          equals: 'home',
        },
      },
    })

    const layout = docs[0]?.layout?.filter(isHomeBlock) ?? []

    return layout.length > 0 ? layout : defaultHomeLayout
  } catch (error) {
    console.error('Unable to load Payload home page layout', error)

    return defaultHomeLayout
  }
}
