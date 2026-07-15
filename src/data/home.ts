import type { Page } from '@/payload-types'

import { getPayloadClient } from './payload'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type HomeLayout = Extract<LayoutBlock, { blockType: `home${string}` }>[]
export type HomeHeroLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeHero' }>
export type HomeIndustriesLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeIndustries' }>
export type HomeProcessLayoutBlock = Extract<HomeLayout[number], { blockType: 'homeProcess' }>

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
    secondaryLabel: 'View products',
    secondaryHref: '/products',
    previewHeading: 'Manufacturing under one roof',
    previewItems: defaultHeroPreviewItems,
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
