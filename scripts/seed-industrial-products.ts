/**
 * Creates the non-aviation products that had a photo in the client's product
 * folder but no entry in the catalogue, each filed under the family whose
 * summary already names it (see src/data/productTaxonomy.ts).
 *
 * Industries come from the family's focus in productTaxonomy.ts, so a new
 * product shows up in exactly the menu columns its family does. SKUs continue
 * the SW-<family code>-NNN scheme the first ten products use.
 *
 * Only creates: a product whose slug already exists is left alone, so editor
 * changes are never overwritten and the script can be re-run.
 *
 *   PRODUCT_IMAGES_DIR="C:\path\to\others" pnpm run seed:industrial-products
 *   (add DRY_RUN=1 to preview)
 *
 * New images land in Cloudinary; run `pnpm run mirror:media` afterwards so
 * they're served from public/ like the rest.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import { industriesForFamily } from '@/data/productTaxonomy'
import { formatSlug } from '@/fields/formatSlug'

const IMAGES_DIR = process.env.PRODUCT_IMAGES_DIR

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

type Seed = {
  title: string
  sku: string
  /** Image file in IMAGES_DIR. */
  file: string
  family: string | null
  summary: string
  /** Defaults to the family's capabilities below. */
  capabilities?: string[]
  /** Defaults to 'custom': almost everything here is made to drawing. */
  productType?: 'custom' | 'service' | 'standard'
  /** Defaults to the family's industry focus. */
  industries?: string[]
  /** Created unpublished for an editor to decide on. */
  draft?: boolean
}

const FAMILY_CAPABILITIES: Record<string, string[]> = {
  'access-platforms-and-safety-structures': ['welding-and-assembly', 'surface-treatment-and-finishing'],
  'architectural-and-interior-metal-works': ['welding-and-assembly', 'surface-treatment-and-finishing'],
  'doors-gates-and-enclosures': ['laser-cutting', 'press-brake-forming', 'welding-and-assembly'],
  'heavy-fabrication-and-structural-steel-works': ['welding-and-assembly', 'surface-treatment-and-finishing'],
  'machine-frames-and-bases': ['welding-and-assembly', 'cnc-and-conventional-machining'],
  'material-handling-and-conveying': ['laser-cutting', 'welding-and-assembly'],
  'precision-machined-components': ['cnc-and-conventional-machining'],
  'process-equipment-and-piping-supports': ['welding-and-assembly', 'surface-treatment-and-finishing'],
  'sheet-metal-products': ['laser-cutting', 'press-brake-forming'],
  'storage-and-workstation-systems': ['laser-cutting', 'press-brake-forming', 'welding-and-assembly'],
  'surface-treated-products': ['surface-treatment-and-finishing'],
  'tubular-products': ['welding-and-assembly', 'surface-treatment-and-finishing'],
}

const FAMILY_TITLES: Record<string, string> = {
  'access-platforms-and-safety-structures': 'Access Platforms & Safety Structures',
  'architectural-and-interior-metal-works': 'Architectural & Interior Metal Works',
  'doors-gates-and-enclosures': 'Doors, Gates & Enclosures',
  'heavy-fabrication-and-structural-steel-works': 'Heavy Fabrication & Structural Steel Works',
  'machine-frames-and-bases': 'Machine Frames & Base Structures',
  'material-handling-and-conveying': 'Material Handling & Conveying',
  'precision-machined-components': 'Precision Machined Components',
  'process-equipment-and-piping-supports': 'Process Equipment & Piping Supports',
  'sheet-metal-products': 'Sheet Metal Products',
  'storage-and-workstation-systems': 'Storage & Workstation Systems',
  'surface-treated-products': 'Surface-Treated Products',
  'tubular-products': 'Tubular Products',
}

const SEEDS: Seed[] = [
  // Precision Machined Components
  {
    title: 'Pins And Hubs',
    sku: 'SW-PR-003',
    file: 'Pins and hubs.png',
    family: 'precision-machined-components',
    summary: 'Machined pins, hubs and flanged bosses turned and bored to drawing for rotating and pivoting assemblies.',
  },
  {
    title: 'Custom Precision Components',
    sku: 'SW-PR-004',
    file: 'Custom precision components.png',
    family: 'precision-machined-components',
    summary: 'One-off and batch precision parts turned, milled and drilled to customer drawings and tolerances.',
  },
  {
    title: 'Machine Parts And Assemblies',
    sku: 'SW-PR-005',
    file: 'Machine parts and assemblies.png',
    family: 'precision-machined-components',
    capabilities: ['cnc-and-conventional-machining', 'welding-and-assembly'],
    summary: 'Machined replacement parts and complete sub-assemblies built to drawing or reverse-engineered from a sample.',
  },

  // Sheet Metal Products
  {
    title: 'Electrical Cabinets And Housings',
    sku: 'SW-SM-003',
    file: 'Electrical cabinets and housings.png',
    family: 'sheet-metal-products',
    summary: 'Laser-cut and formed electrical cabinets, control housings and junction enclosures, finished to specification.',
  },
  {
    title: 'Brackets And Support Structures',
    sku: 'SW-SM-004',
    file: 'Brackets and support structures.png',
    family: 'sheet-metal-products',
    summary: 'Formed and welded brackets, mounting plates and support structures for equipment, services and installations.',
  },

  // Heavy Fabrication & Structural Steel Works
  {
    title: 'Structural Steel Frameworks',
    sku: 'SW-HF-003',
    file: 'Structural steel frameworks.png',
    family: 'heavy-fabrication-and-structural-steel-works',
    summary: 'Fabricated structural steel frames, trusses and support structures for buildings, plant and infrastructure.',
  },
  {
    title: 'Industrial Structures',
    sku: 'SW-HF-004',
    file: 'Industrial structures.png',
    family: 'heavy-fabrication-and-structural-steel-works',
    summary: 'Steel sheds, mezzanines, equipment structures and plant buildings fabricated and finished for industrial sites.',
  },
  {
    title: 'Frames And Fabricated Assemblies',
    sku: 'SW-HF-005',
    file: 'Frames and fabricated assemblies.png',
    family: 'heavy-fabrication-and-structural-steel-works',
    summary: 'Welded frames and multi-part fabricated assemblies built to drawing and delivered ready to install.',
  },
  {
    title: 'Custom Fabricated Assemblies',
    sku: 'SW-HF-006',
    file: 'Custom Fabricated Assemblies.png',
    family: 'heavy-fabrication-and-structural-steel-works',
    summary: 'Bespoke fabricated assemblies engineered from a drawing, sample or concept and built to project requirements.',
  },
  {
    title: 'Customized Engineering Products',
    sku: 'SW-HF-007',
    file: 'Customized engineering products.png',
    family: 'heavy-fabrication-and-structural-steel-works',
    capabilities: ['welding-and-assembly', 'cnc-and-conventional-machining', 'surface-treatment-and-finishing'],
    summary: 'Engineered-to-order products designed around a specific requirement, from first drawing through fabrication and finishing.',
  },

  // Architectural & Interior Metal Works
  {
    title: 'Decorative Metal Partitions',
    sku: 'SW-AM-003',
    file: 'Decorative metal partitions.png',
    family: 'architectural-and-interior-metal-works',
    capabilities: ['laser-cutting', 'welding-and-assembly', 'surface-treatment-and-finishing'],
    summary: 'Laser-cut decorative screens and metal partitions for interiors, facades and feature walls.',
  },
  {
    title: 'Interior Staircases',
    sku: 'SW-AM-004',
    file: 'Interior Staircases.png',
    family: 'architectural-and-interior-metal-works',
    summary: 'Straight, spiral and feature staircases in steel and stainless steel for homes, offices and commercial interiors.',
  },
  {
    title: 'Furniture Frames',
    sku: 'SW-AM-005',
    file: 'Furniture frames.png',
    family: 'architectural-and-interior-metal-works',
    summary: 'Steel and stainless frames for tables, seating, shelving and custom furniture, finished to match the space.',
  },
  {
    title: 'Steel Parking Canopy',
    sku: 'SW-AM-006',
    file: 'Steel Parking Canopy.png',
    family: 'architectural-and-interior-metal-works',
    industries: ['architectural-and-interior-metalwork', 'construction-and-infrastructure'],
    summary: 'Fabricated steel car parking canopies and shade structures for residential, commercial and industrial sites.',
  },

  // Tubular Products
  {
    title: 'Stainless Steel Tubular Structures',
    sku: 'SW-TB-003',
    file: 'Stainless steel tubular structures.png',
    family: 'tubular-products',
    summary: 'Stainless steel tube frames and tubular assemblies for hygienic, architectural and industrial applications.',
  },
  {
    title: 'Tubular Furniture Frames',
    sku: 'SW-TB-004',
    file: 'Tubular Furniture Frames.png',
    family: 'tubular-products',
    summary: 'Bent and welded tubular frames for chairs, tables, benches and workstation furniture.',
  },

  // Surface-Treated Products
  {
    title: 'Industrial Painted Assemblies',
    sku: 'SW-ST-001',
    file: 'Industrial painted assemblies.png',
    family: 'surface-treated-products',
    capabilities: ['welding-and-assembly', 'surface-treatment-and-finishing'],
    summary: 'Fabricated assemblies prepared and finished with industrial paint systems for durable, site-ready protection.',
  },
  {
    title: 'Powder-Coated Structures',
    sku: 'SW-ST-002',
    file: 'Powder-coated structures.png',
    family: 'surface-treated-products',
    capabilities: ['welding-and-assembly', 'surface-treatment-and-finishing'],
    summary: 'Steel structures and frames powder-coated for a hard-wearing, even finish in the colour specified.',
  },
  {
    title: 'Galvanized Steel Products',
    sku: 'SW-ST-003',
    file: 'Galvanized steel products.png',
    family: 'surface-treated-products',
    summary: 'Galvanized steel frames, supports and components protected for outdoor and corrosive environments.',
  },
  {
    title: 'Corrosion-Resistant Components',
    sku: 'SW-ST-004',
    file: 'Corrosion-resistant components.png',
    family: 'surface-treated-products',
    summary: 'Components in stainless steel or with protective coatings for wet, chemical and coastal service.',
  },
  {
    title: 'Customer-Specific Finished Product',
    sku: 'SW-ST-005',
    file: 'Customer-specific finished product.png',
    family: 'surface-treated-products',
    capabilities: ['welding-and-assembly', 'surface-treatment-and-finishing'],
    summary: 'Products fabricated, assembled and finished to the customer’s own specification, colour and packaging requirements.',
  },

  // Material Handling & Conveying
  {
    title: 'Conveyor Structures',
    sku: 'SW-MH-001',
    file: 'Conveyor structures.png',
    family: 'material-handling-and-conveying',
    summary: 'Fabricated conveyor frames, supports and gantries for roller and belt conveyor lines.',
  },

  // Storage & Workstation Systems
  {
    title: 'Storage Racks And Workstations',
    sku: 'SW-SR-001',
    file: 'Storage racks and workstations.png',
    family: 'storage-and-workstation-systems',
    summary: 'Heavy-duty storage racks, shelving and workbenches for production floors, stores and assembly bays.',
  },

  // Machine Frames & Base Structures
  {
    title: 'Machine Frames And Support Structures',
    sku: 'SW-MF-001',
    file: 'Machine frames and support structures.png',
    family: 'machine-frames-and-bases',
    summary: 'Rigid welded machine frames and support structures, machined where mounting faces must be true.',
  },
  {
    title: 'Skids And Base Frames',
    sku: 'SW-MF-002',
    file: 'Skids and base frames.png',
    family: 'machine-frames-and-bases',
    summary: 'Equipment skids and base frames for pumps, generators, compressors and packaged plant.',
  },

  // Access Platforms & Safety Structures
  {
    title: 'Maintenance Platforms',
    sku: 'SW-AP-001',
    file: 'Maintenance platforms.png',
    family: 'access-platforms-and-safety-structures',
    summary: 'Fixed and mobile maintenance platforms with stairs, handrails and anti-slip decking for safe access to plant.',
  },
  {
    title: 'Emergency Staircases',
    sku: 'SW-AP-002',
    file: 'Emergency Staircases.png',
    family: 'access-platforms-and-safety-structures',
    industries: ['construction-and-infrastructure', 'industrial-manufacturing'],
    summary: 'External steel emergency and fire-escape staircases with landings and guardrails, galvanized or painted.',
  },
  {
    title: 'Safety Guards And Protective Structures',
    sku: 'SW-AP-003',
    file: 'Safety guards and protective structures.png',
    family: 'access-platforms-and-safety-structures',
    summary: 'Machine guarding, safety cages and protective structures that keep people clear of moving plant.',
  },

  // Doors, Gates & Enclosures
  {
    title: 'Metal Doors And Gates',
    sku: 'SW-DG-001',
    file: 'Metal doors and gates.png',
    family: 'doors-gates-and-enclosures',
    summary: 'Steel doors, sliding and swing gates, and access hatches fabricated to the opening size.',
  },

  // Process Equipment & Piping Supports
  {
    title: 'Process Piping Supports',
    sku: 'SW-PE-001',
    file: 'Process piping supports.png',
    family: 'process-equipment-and-piping-supports',
    summary: 'Pipe racks, shoes, clamps and support steelwork for process piping and utility lines.',
  },

  /*
   * productTaxonomy.ts deliberately keeps repair and refurbishment out of the
   * product families: it is sold as a service. It is created unfiled and
   * unpublished so an editor can decide whether it belongs in the catalogue.
   */
  {
    title: 'Repair And Refurbishment Solutions',
    sku: 'SW-SV-001',
    file: 'Repair and refurbishment solutions.png',
    family: null,
    productType: 'service',
    capabilities: ['welding-and-assembly', 'cnc-and-conventional-machining', 'surface-treatment-and-finishing'],
    industries: ['maintenance-and-repair-services'],
    draft: true,
    summary: 'Repair, rebuild and refurbishment of worn or damaged metal equipment, structures and components.',
  },
]

async function idsBySlug(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'capabilities' | 'industries' | 'product-families',
) {
  const { docs } = await payload.find({
    collection,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    select: { slug: true },
  })
  return new Map(docs.map((doc) => [doc.slug as string, doc.id]))
}

// Top-level await: `payload run` exits once module evaluation settles.
{
  if (!IMAGES_DIR) throw new Error('Set PRODUCT_IMAGES_DIR to the folder of product images.')

  const payload = await getPayload({ config })
  const families = await idsBySlug(payload, 'product-families')
  const industries = await idsBySlug(payload, 'industries')
  const capabilities = await idsBySlug(payload, 'capabilities')

  const lookup = (map: Map<string, number>, slugs: string[], kind: string) =>
    slugs.map((slug) => {
      const id = map.get(slug)
      if (id === undefined) throw new Error(`Unknown ${kind} "${slug}".`)
      return id
    })

  let created = 0
  const skipped: string[] = []

  for (const seed of SEEDS) {
    const slug = formatSlug(seed.title)
    const existing = await payload.find({
      collection: 'products',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { or: [{ slug: { equals: slug } }, { sku: { equals: seed.sku } }] },
    })

    if (existing.totalDocs) {
      skipped.push(`${seed.sku} ${seed.title}`)
      continue
    }

    const filePath = path.join(IMAGES_DIR, seed.file)
    if (!existsSync(filePath)) throw new Error(`Missing image: ${filePath}`)

    const industrySlugs = seed.industries ?? (seed.family ? industriesForFamily(seed.family) : [])
    const capabilitySlugs = seed.capabilities ?? (seed.family ? FAMILY_CAPABILITIES[seed.family] : [])
    const familyTitle = seed.family ? FAMILY_TITLES[seed.family] : 'Repair & refurbishment service'

    if (dryRun) {
      console.log(
        `  would create ${seed.sku} ${seed.title} — ${seed.family ?? 'no family'}; ` +
          `${industrySlugs.join(', ')}${seed.draft ? ' (draft)' : ''}`,
      )
      continue
    }

    const image = await payload.create({
      collection: 'media',
      data: { alt: seed.title },
      filePath,
      overrideAccess: true,
    })

    await payload.create({
      collection: 'products',
      data: {
        _status: seed.draft ? 'draft' : 'published',
        capabilities: lookup(capabilities, capabilitySlugs, 'capability'),
        dimensions: { notes: 'Dimensions configurable by drawing, sample, or project requirement.' },
        featuredImage: image.id,
        industries: lookup(industries, industrySlugs, 'industry'),
        isConfigurable: false,
        loadCapacity: 'By requirement',
        productFamily: seed.family ? lookup(families, [seed.family], 'family')[0] : undefined,
        productType: seed.productType ?? 'custom',
        sku: seed.sku,
        slug,
        specifications: [
          { label: 'Manufacturing route', value: familyTitle },
          { label: 'Finish', value: 'Painted, powder-coated, galvanized, or stainless finish' },
          { label: 'Source input', value: 'Drawing, sample, concept, or problem statement' },
        ],
        summary: seed.summary,
        surfaceTreatment:
          'Industrial painting, powder coating, galvanizing, or customer-specific finishing available.',
        thumbnailImage: image.id,
        title: seed.title,
      },
      draft: seed.draft,
      overrideAccess: true,
    })

    created += 1
    console.log(`  create ${seed.sku} ${seed.title}${seed.draft ? ' (draft)' : ''}`)
  }

  console.log(`\n${dryRun ? 'Dry run: ' : ''}${created} created, ${skipped.length} already present.`)
  for (const line of skipped) console.log(`  skip ${line}`)

  await payload.db.destroy?.()
}
