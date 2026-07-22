import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import 'dotenv/config'
import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const tmpDir = path.join(os.tmpdir(), 'skywings-dummy-catalog')

// Committed sample renders used to give a couple of products the full Figma
// design content (hero, gallery, how-it-works, technical drawing).
const productImageDir = path.join(process.cwd(), 'public', 'images', 'products')

// Minimal Lexical rich-text builders for seeded product descriptions.
const lexText = (text: string, bold = false) => ({
  detail: 0,
  format: bold ? 1 : 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})
const lexParagraph = (children: ReturnType<typeof lexText>[]) => ({
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})
const lexRichText = (paragraphs: ReturnType<typeof lexParagraph>[]) => ({
  root: {
    children: paragraphs,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

type ProductRich = {
  accessories?: { label: string; value: string }[]
  breadcrumb?: string
  categoryLabel?: string
  configurationOptions?: Record<string, unknown>[]
  description?: unknown
  featuredImage?: string
  gallery?: string[]
  howItWorks?: { caption: string; heading: string; image: string }
  industryLabel?: string
  keySpecs?: { label: string; value: string }[]
  specifications?: { label: string; unit?: string; value: string }[]
  technicalDrawing?: string
}

// Per-SKU rich content matching the Figma product template. Any product not
// listed here still seeds with the generic defaults below.
const productRichContent: Record<string, ProductRich> = {
  'GSE-FS-038': {
    breadcrumb: 'Aviation / GSE / Stands',
    industryLabel: 'Aviation GSE',
    categoryLabel: 'Maintenance & Stand',
    featuredImage: 'folding-stand-hero.png',
    gallery: ['thumb-1.png', 'thumb-2.png', 'thumb-3.png', 'thumb-4.png'],
    keySpecs: [
      { label: 'Type', value: 'Folding' },
      { label: 'Material', value: 'Aluminium' },
      { label: 'Surface', value: 'Powder Coated' },
      { label: 'Size', value: '20m x 40m x 20m' },
      { label: 'Weight', value: '20kg' },
      { label: 'Capacity', value: '200kg' },
    ],
    description: lexRichText([
      lexParagraph([
        lexText('Sky Wings provides '),
        lexText('End-to-End Metal Manufacturing', true),
        lexText(
          '. We take a requirement — a drawing, a sample, a concept, or a problem to solve — and convert it into a ',
        ),
        lexText('manufactured product', true),
        lexText('.'),
      ]),
      lexParagraph([
        lexText(
          'Foldable work stand provides stable elevated access while saving storage space when not in use.',
        ),
      ]),
    ]),
    howItWorks: {
      heading: 'How it works',
      image: 'fold-unfold.png',
      caption: 'Folds flat for storage, unfolds to a 180° working platform.',
    },
    specifications: [
      { label: 'Code', value: 'GSE-OB-04' },
      { label: 'Application', value: '777X and 777 legacy' },
      { label: 'Movement', value: '2 Persons' },
      { label: 'Weight', value: '700', unit: 'kg' },
      { label: 'Material', value: 'Steel Construction' },
      { label: 'Deck Type', value: 'Roller Deck' },
      { label: 'Finish', value: 'Powder Coated' },
      { label: 'Application', value: 'ULD & Cargo Transfer' },
    ],
    accessories: [
      { label: 'Code', value: 'GSE-OB-04' },
      { label: 'Application', value: '777X and 777 legacy' },
      { label: 'Movement', value: '2 Persons' },
      { label: 'Weight', value: '700 kg' },
      { label: 'Material', value: 'Steel Construction' },
    ],
    technicalDrawing: 'technical-drawing.png',
    configurationOptions: [
      {
        group: 'Material',
        options: [
          { label: 'Steel', value: 'steel' },
          { label: 'Aluminium', value: 'aluminium' },
        ],
      },
      {
        group: 'Size',
        options: [
          { label: '10m', value: '10m' },
          { label: '20m', value: '20m' },
        ],
      },
      {
        group: 'Wheel Type',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Pneumatic Tires', value: 'pneumatic' },
        ],
      },
      {
        group: 'Towbar',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Hook', value: 'hook' },
          { label: 'Free', value: 'free' },
        ],
      },
      {
        group: 'Finishing',
        options: [
          { label: 'Paint', value: 'paint' },
          { label: 'Powder Coating', value: 'powder' },
        ],
      },
      {
        group: 'Color',
        options: [
          { label: 'Blue', value: 'blue', swatch: '#3d47ff' },
          { label: 'White', value: 'white', swatch: '#f0f0f0' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    ],
  },
}

type CollectionSlug =
  | 'brochures'
  | 'capabilities'
  | 'industries'
  | 'media'
  | 'product-families'
  | 'products'

type SeedDoc = {
  id: number
  slug?: string | null
  title?: string | null
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

function pdfBuffer(title: string, lines: string[]) {
  const text = [title, ...lines].join('\\n')
  const escapedText = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const stream = `BT /F1 18 Tf 56 760 Td (${escapedText.replace(/\n/g, ') Tj T* (')}) Tj ET`
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ]
  let body = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += `${object}\n`
  }

  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body)
}

function productSvg(title: string, code: string, kind: string, accent = '#2453d4') {
  const safeTitle = escapeXml(title)
  const safeCode = escapeXml(code)
  const safeKind = escapeXml(kind)

  return `
  <svg width="1200" height="820" viewBox="0 0 1200 820" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="metal" x1="0" x2="1">
        <stop offset="0" stop-color="#f7f7f5"/>
        <stop offset="0.5" stop-color="#cfd4d7"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#08113b" flood-opacity="0.18"/>
      </filter>
    </defs>
    <rect width="1200" height="820" rx="46" fill="#f2f2f0"/>
    <text x="70" y="86" fill="#e1e1de" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">${safeCode}</text>
    <g filter="url(#shadow)" transform="translate(210 210)">
      <rect x="60" y="190" width="660" height="92" rx="22" fill="url(#metal)" stroke="#aeb5b8" stroke-width="4"/>
      <rect x="88" y="172" width="604" height="24" rx="12" fill="${accent}"/>
      <g stroke="#879197" stroke-width="10" stroke-linecap="round">
        <line x1="130" y1="206" x2="130" y2="264"/>
        <line x1="220" y1="206" x2="220" y2="264"/>
        <line x1="310" y1="206" x2="310" y2="264"/>
        <line x1="400" y1="206" x2="400" y2="264"/>
        <line x1="490" y1="206" x2="490" y2="264"/>
        <line x1="580" y1="206" x2="580" y2="264"/>
      </g>
      <rect x="114" y="292" width="86" height="130" rx="15" fill="#244cbf"/>
      <rect x="586" y="292" width="86" height="130" rx="15" fill="#244cbf"/>
      <circle cx="145" cy="438" r="34" fill="#222"/>
      <circle cx="631" cy="438" r="34" fill="#222"/>
      <circle cx="145" cy="438" r="18" fill="#d9dcde"/>
      <circle cx="631" cy="438" r="18" fill="#d9dcde"/>
      <path d="M95 168 C220 78, 375 78, 704 166" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round" opacity="0.18"/>
      <path d="M100 174 C224 95, 392 96, 690 174" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
    </g>
    <text x="70" y="680" fill="#08113b" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">${safeTitle}</text>
    <text x="70" y="728" fill="#666" font-family="Arial, Helvetica, sans-serif" font-size="25">${safeKind}</text>
  </svg>`
}

async function writeProductImage(title: string, code: string, kind: string, accent?: string) {
  const filePath = path.join(tmpDir, `${slugify(`${code}-${title}`)}.png`)
  await sharp(Buffer.from(productSvg(title, code, kind, accent))).png().toFile(filePath)
  return filePath
}

async function writePdf(slug: string, title: string, lines: string[]) {
  const filePath = path.join(tmpDir, `${slug}.pdf`)
  await fs.writeFile(filePath, pdfBuffer(title, lines))
  return filePath
}

async function findBySlug(payload: Awaited<ReturnType<typeof getPayload>>, collection: CollectionSlug, slug: string) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0] as SeedDoc | undefined
}

async function upsertBySlug(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: Exclude<CollectionSlug, 'media'>,
  data: Record<string, unknown> & { slug: string; title: string },
) {
  const existing = await findBySlug(payload, collection, data.slug)

  if (existing) {
    return payload.update({
      collection,
      data,
      id: existing.id,
      overrideAccess: true,
    }) as Promise<SeedDoc>
  }

  return payload.create({
    collection,
    data,
    overrideAccess: true,
  }) as Promise<SeedDoc>
}

async function ensureMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string,
) {
  const filename = path.basename(filePath)
  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      filename: {
        equals: filename,
      },
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0] as SeedDoc
  }

  return payload.create({
    collection: 'media',
    data: { alt },
    filePath,
    overrideAccess: true,
  }) as Promise<SeedDoc>
}

async function ensureBrochure(
  payload: Awaited<ReturnType<typeof getPayload>>,
  data: Record<string, unknown> & { slug: string; title: string },
  filePath: string,
) {
  const existing = await findBySlug(payload, 'brochures', data.slug)

  if (existing) {
    return payload.update({
      collection: 'brochures',
      data,
      id: existing.id,
      overrideAccess: true,
    }) as Promise<SeedDoc>
  }

  return payload.create({
    collection: 'brochures',
    data,
    filePath,
    overrideAccess: true,
  }) as Promise<SeedDoc>
}

export async function seedDummyCatalog() {
  await fs.rm(tmpDir, { force: true, recursive: true })
  await fs.mkdir(tmpDir, { recursive: true })

  const payload = await getPayload({ config })

  const capabilitySeeds = [
    ['Laser Cutting', 'sheet-metal', 'Fast, clean, high-accuracy profiling of sheet and plate for blanks, panels, guards, and complex geometries.', 'Sheet and plate profiling, optimized nests, high repeatability.'],
    ['Shearing', 'sheet-metal', 'Straight cutting for steel, aluminum, and stainless stock prepared for forming, machining, or fabrication.', 'Cut sheet blanks, strips, flat bars, and fabrication-ready plate sets.'],
    ['CNC & Conventional Machining', 'machining', 'Precision turning, milling, drilling, and fixture work for shafts, rollers, flanges, bushings, and custom machine parts.', 'Small precision components through larger fabricated assemblies.'],
    ['Press-Brake Forming', 'bending-forming', 'Controlled bending for panels, covers, brackets, enclosures, guards, and custom sheet metal profiles.', 'Repeatable folds, bends, channels, and enclosure bodies.'],
    ['Plate & Sheet Rolling', 'bending-forming', 'Rolling capacity for cylindrical and conical profiles including tanks, shells, rollers, and curved parts.', 'Curved profiles and cylindrical forms up to project-specific sizes.'],
    ['Radial & Heavy Drilling', 'machining', 'Heavy workpiece drilling and connection plate preparation for platforms, frames, pipe flanges, and steel structures.', 'Hole patterns, heavy brackets, frame plates, and structural connections.'],
    ['Hydraulic Pressing', 'fabrication', 'Pressing and forming operations for stamped panels, reinforcements, formed brackets, and deep drawn components.', 'Hydraulic forming for repeatable industrial parts.'],
    ['Welding & Assembly', 'welding', 'MIG, TIG, stick, and flux-cored welding supported by fit-up, fabrication, assembly, and inspection workflows.', 'Fabricated assemblies, skids, stairs, frames, platforms, and supports.'],
    ['Surface Treatment & Finishing', 'surface-treatment', 'Industrial painting, powder coating, galvanizing, and corrosion-resistant finishing for manufactured products.', 'Painted, powder-coated, galvanized, and project-specific finished goods.'],
  ] as const

  const capabilityMap = new Map<string, SeedDoc>()
  for (const [index, seed] of capabilitySeeds.entries()) {
    const [title, processType, summary, capacityNotes] = seed
    const image = await ensureMedia(
      payload,
      await writeProductImage(title, `CAP-${String(index + 1).padStart(2, '0')}`, 'Process capability', '#2453d4'),
      `${title} capability image`,
    )
    const doc = await upsertBySlug(payload, 'capabilities', {
      _status: 'published',
      capacityNotes,
      featuredImage: image.id,
      processType,
      slug: slugify(title),
      sortOrder: index + 1,
      summary,
      title,
      typicalOutputs: [
        { label: 'Project-specific parts' },
        { label: 'Production-ready assemblies' },
        { label: 'Quality-controlled finishing' },
      ],
    })
    capabilityMap.set(slugify(title), doc)
  }

  const industrySeeds = [
    ['Construction & Infrastructure', 'Structural steel, platforms, canopies, safety barriers, connection plates, and fabricated infrastructure metalwork.'],
    ['Architectural & Interior Metalwork', 'Decorative partitions, railings, stairs, pergolas, canopies, furniture frames, and premium interior metal elements.'],
    ['Custom Metal Fabrication', 'Customer-specific metal products from drawings, samples, concepts, and practical engineering problems.'],
    ['Heavy Equipment & Machinery', 'Machine frames, guards, access platforms, skids, support structures, and replacement assemblies.'],
    ['Industrial Manufacturing', 'Conveyors, workstations, storage racks, piping supports, safety cages, panels, and production-floor systems.'],
    ['Oil & Gas', 'Heavy-duty supports, corrosion-resistant fabricated parts, skid frames, and maintenance-oriented steel assemblies.'],
    ['Aviation Ground Support Equipment', 'GSE products, aircraft maintenance access, cargo handling, bowsers, dollies, stands, ladders, and carts.'],
    ['Marine & Offshore', 'Fabricated support structures, corrosion-resistant products, access systems, and custom marine assemblies.'],
    ['Maintenance & Repair Services', 'Repair, refurbishment, reverse engineering, replacement parts, and service-ready industrial components.'],
  ] as const

  const industryMap = new Map<string, SeedDoc>()
  for (const [index, [title, summary]] of industrySeeds.entries()) {
    const image = await ensureMedia(
      payload,
      await writeProductImage(title, `IND-${String(index + 1).padStart(2, '0')}`, 'Industry served', index % 2 ? '#f6c500' : '#2453d4'),
      `${title} industry image`,
    )
    const doc = await upsertBySlug(payload, 'industries', {
      _status: 'published',
      heroImage: image.id,
      painPoints: [
        { point: 'Short lead times and custom dimensions' },
        { point: 'Durable finish requirements' },
        { point: 'Need for fabrication, machining, and assembly under one roof' },
      ],
      relatedCapabilities: Array.from(capabilityMap.values()).slice(0, 5).map((item) => item.id),
      slug: slugify(title),
      solutions: [
        { title: 'Design-to-manufacture support', description: 'Convert drawings, concepts, or samples into production-ready components.' },
        { title: 'Integrated production', description: 'Machining, sheet metal, welding, assembly, and finishing connected in one workflow.' },
      ],
      sortOrder: index + 1,
      summary,
      title,
    })
    industryMap.set(slugify(title), doc)
  }

  const familySeeds = [
    ['Modular Conveyor System', 'Configurable straight, curved, roller, and belt conveyor modules for cargo, industrial, and component-transfer workflows.'],
    ['Aviation Ground Support Equipment', 'GSE access, cargo, service, maintenance, and support products for aircraft and airport operations.'],
    ['Industrial Solutions', 'Machine frames, conveyors, racks, workstations, safety guards, piping supports, and production-floor structures.'],
    ['Precision Machined Components', 'Shafts, rollers, couplings, pins, hubs, bushings, flanges, and custom machined parts.'],
    ['Sheet Metal Products', 'Panels, enclosures, guards, brackets, covers, cabinets, housings, and laser-cut formed parts.'],
    ['Heavy Fabrication & Structural Steel Works', 'Platforms, tanks, walkways, skids, base frames, structural frameworks, and engineered assemblies.'],
    ['Architectural & Interior Metal Works', 'Railings, decorative partitions, stairs, pergolas, canopies, and furniture frames.'],
    ['Surface-Treated Products', 'Painted, powder-coated, galvanized, and corrosion-resistant metal products.'],
    ['Tubular Products', 'Handrails, safety barriers, tubular guards, frames, carts, and stainless tubular structures.'],
    ['ULD Containers & Pallets', 'ULD containers, cargo pallets, pallet nets, and aircraft cargo handling products.'],
  ] as const

  const familyMap = new Map<string, SeedDoc>()
  for (const [index, [title, summary]] of familySeeds.entries()) {
    const industryFocus =
      title.includes('Aviation') || title.includes('ULD')
        ? [industryMap.get('aviation-ground-support-equipment')?.id].filter(Boolean)
        : Array.from(industryMap.values()).slice(0, 4).map((item) => item.id)
    const doc = await upsertBySlug(payload, 'product-families', {
      _status: 'published',
      industryFocus,
      slug: slugify(title),
      sortOrder: index + 1,
      summary,
      title,
    })
    familyMap.set(slugify(title), doc)
  }

  const ids = (slugs: readonly string[], map: Map<string, SeedDoc>) =>
    slugs.map((slug) => map.get(slug)?.id).filter(Boolean)

  const productSeeds = [
    ['Modular Conveyor System', 'GSE-RC', 'Configurable conveyor solution including straight, curved, belt, and transfer modules for cargo systems.', 'Modular Conveyor System', ['aviation-ground-support-equipment', 'industrial-manufacturing'], ['laser-cutting', 'cnc-and-conventional-machining', 'welding-and-assembly'], 'configurable'],
    ['Inline Conveyor 380V', 'GSE-IC380-032', 'Powered inline roller conveyor for heavy component transfer tasks.', 'Modular Conveyor System', ['industrial-manufacturing', 'aviation-ground-support-equipment'], ['cnc-and-conventional-machining', 'welding-and-assembly'], 'standard'],
    ['Rotator Conveyor 380V', 'GSE-RC380-033', 'Powered rotating conveyor for directional cargo transfer and positioning.', 'Modular Conveyor System', ['industrial-manufacturing', 'aviation-ground-support-equipment'], ['cnc-and-conventional-machining', 'welding-and-assembly'], 'standard'],
    ['Pallet Dispenser', 'GSE-PD-034', 'Automated pallet dispenser for controlled pallet feeding and handling.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'custom'],
    ['Towable Belt Loader', 'GSE-TBL-035', 'Towable belt loader for aircraft baggage and cargo loading.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly', 'surface-treatment-and-finishing'], 'standard'],
    ['Straight Ladders', 'GSE-SL-036', 'Straight maintenance ladders for safe elevated aircraft access work.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment', 'maintenance-and-repair-services'], ['welding-and-assembly', 'surface-treatment-and-finishing'], 'standard'],
    ['Cowl Pylon Ladders', 'GSE-CPL-037', 'Specialized ladders for aircraft cowl and pylon maintenance access.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['welding-and-assembly'], 'custom'],
    ['Folding Stand', 'GSE-FS-038', 'Compact folding platform for portable aircraft maintenance access tasks.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['sheet-metal', 'welding-and-assembly'], 'standard'],
    ['Cargo Stairs', 'GSE-CS-039', 'Compact cargo stairs for safe aircraft servicing and access.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['welding-and-assembly', 'surface-treatment-and-finishing'], 'standard'],
    ['Maintenance Stair', 'GSE-MS-040', 'Mobile maintenance stair for safe aircraft inspection and servicing.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['welding-and-assembly'], 'standard'],
    ['Maintenance Access Stair', 'GSE-MAS-041', 'Elevated access stair for larger aircraft maintenance work zones.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['welding-and-assembly'], 'custom'],
    ['Propeller Stand', 'GSE-PSD-042', 'Stable propeller stand for aircraft propeller maintenance and display.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'custom'],
    ['Hydraulic Maintenance Steps', 'GSE-HMS-043', 'Hydraulic maintenance steps for adjustable aircraft access support work.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'configurable'],
    ['Windshield Maintenance Platform', 'GSE-WMP-044', 'Service platform for safe aircraft windshield access.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'custom'],
    ['B1 Maintenance Stand', 'GSE-B1MS-045', 'Adjustable B1 stand for high-level aircraft maintenance access.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['welding-and-assembly'], 'configurable'],
    ['Flatbed Trolley', 'GSE-FBT-005', 'Carries heavy cargo and baggage loads across service areas.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'standard'],
    ['Caster Deck Dolly', 'GSE-CDD-006', 'Handles ULD containers with caster deck supports LD1, LD2, and LD3.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'surface-treatment-and-finishing'], 'standard'],
    ['Roller Deck Dolly', 'GSE-RDD-007', 'Roller-deck dolly for controlled ULD cargo transfer operations.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'cnc-and-conventional-machining'], 'standard'],
    ['Static Roller Rack', 'GSE-SRR-009', 'Fixed roller rack for gravity-assisted cargo transfer operations.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['cnc-and-conventional-machining', 'welding-and-assembly'], 'standard'],
    ['Slave Pallet Rack', 'GSE-SPR-010', 'Low-profile slave pallet rack for ULD and pallet transfer.', 'ULD Containers & Pallets', ['aviation-ground-support-equipment'], ['fabrication'], 'standard'],
    ['LD3 Container Dolly', 'GSE-LD3D-011', 'Compact LD3 dolly for safe single-container ramp movement.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'welding-and-assembly'], 'standard'],
    ['ULD Rack', 'GSE-ULDR-012', 'Mobile storage rack for organizing ULD containers and equipment.', 'ULD Containers & Pallets', ['aviation-ground-support-equipment'], ['fabrication'], 'standard'],
    ['Gantry Crane Portable', 'GSE-GCP-015', 'Portable gantry crane for flexible workshop lifting operations.', 'Industrial Solutions', ['industrial-manufacturing', 'maintenance-and-repair-services'], ['heavy-fabrication-and-structural-steel-works', 'welding-and-assembly'], 'custom'],
    ['Water Bowser', 'GSE-WB-017', 'Towable water bowser for aircraft potable water servicing operations.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'surface-treatment-and-finishing'], 'standard'],
    ['Fuel Bowser', 'GSE-FB-018', 'Towable fuel bowser for controlled aircraft fuel service support.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication', 'surface-treatment-and-finishing'], 'custom'],
    ['Oxygen Cart', 'GSE-OC-019', 'Mobile oxygen cylinder cart for aircraft servicing and maintenance.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['tubular-products', 'welding-and-assembly'], 'standard'],
    ['Transfer Ramp', 'GSE-TR-020', 'Portable transfer ramp for safe cargo loading transitions.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['sheet-metal', 'welding-and-assembly'], 'standard'],
    ['Tire Trailer', 'GSE-TT-022', 'Towable trailer for transporting aircraft wheels and tire assemblies.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['fabrication'], 'standard'],
    ['Luggage Trolley', 'GSE-LT-057', 'Compact airport luggage trolley for smooth passenger baggage handling.', 'Aviation Ground Support Equipment', ['aviation-ground-support-equipment'], ['tubular-products'], 'standard'],
    ['Beverage Cart', 'GSE-BC-063', 'Aluminum beverage cart for organized inflight drink service storage.', 'Sheet Metal Products', ['aviation-ground-support-equipment'], ['sheet-metal', 'cnc-and-conventional-machining'], 'standard'],
    ['Meal Cart - Full Size', 'GSE-MCF-065', 'Full-size inflight meal cart for aircraft catering operations.', 'Sheet Metal Products', ['aviation-ground-support-equipment'], ['sheet-metal'], 'standard'],
    ['ULD Containers', 'GSE-ULDC-01-13', 'LD1, LD2, LD3, LD3-45, LD4, LD6, LD7, LD8, LD9, LD11, LD26, LD29, and M-1H containers.', 'ULD Containers & Pallets', ['aviation-ground-support-equipment'], ['sheet-metal', 'cnc-and-conventional-machining'], 'custom'],
    ['Pallet Net', 'GSE-PN-056', 'Cargo pallet net for securing freight during aircraft transport.', 'ULD Containers & Pallets', ['aviation-ground-support-equipment'], ['custom-metal-fabrication'], 'standard'],
    ['Shafts And Rollers', 'SW-PR-001', 'Precision machined shafts and rollers for conveyors, machines, and industrial assemblies.', 'Precision Machined Components', ['industrial-manufacturing', 'heavy-equipment-and-machinery'], ['cnc-and-conventional-machining'], 'custom'],
    ['Bushings And Couplings', 'SW-PR-002', 'Machined bushings, sleeves, couplings, and mating components built to drawing.', 'Precision Machined Components', ['industrial-manufacturing'], ['cnc-and-conventional-machining'], 'custom'],
    ['Equipment Panels And Enclosures', 'SW-SM-001', 'Sheet metal panels and enclosures for equipment, controls, and industrial installations.', 'Sheet Metal Products', ['industrial-manufacturing', 'custom-metal-fabrication'], ['laser-cutting', 'press-brake-forming'], 'custom'],
    ['Guards And Protective Covers', 'SW-SM-002', 'Protective covers, guards, and perforated panels for machines and equipment.', 'Sheet Metal Products', ['industrial-manufacturing', 'heavy-equipment-and-machinery'], ['laser-cutting', 'press-brake-forming'], 'custom'],
    ['Platforms And Walkways', 'SW-HF-001', 'Platforms, walkways, handrails, and access systems for industrial and infrastructure sites.', 'Heavy Fabrication & Structural Steel Works', ['construction-and-infrastructure', 'industrial-manufacturing'], ['welding-and-assembly', 'surface-treatment-and-finishing'], 'custom'],
    ['Tanks And Cylindrical Structures', 'SW-HF-002', 'Rolled tanks, cylindrical structures, and pressure-vessel support shells.', 'Heavy Fabrication & Structural Steel Works', ['oil-and-gas', 'industrial-manufacturing'], ['plate-and-sheet-rolling', 'welding-and-assembly'], 'custom'],
    ['Stainless Steel Railings', 'SW-AM-001', 'Stainless steel railings and architectural guard systems for interior and exterior spaces.', 'Architectural & Interior Metal Works', ['architectural-and-interior-metalwork'], ['tubular-products', 'surface-treatment-and-finishing'], 'custom'],
    ['Pergolas And Canopies', 'SW-AM-002', 'Fabricated pergolas, parking canopies, and architectural shade structures.', 'Architectural & Interior Metal Works', ['architectural-and-interior-metalwork', 'construction-and-infrastructure'], ['fabrication', 'surface-treatment-and-finishing'], 'custom'],
    ['Handrails And Safety Barriers', 'SW-TB-001', 'Tubular handrails, safety barriers, and industrial protection rails.', 'Tubular Products', ['construction-and-infrastructure', 'industrial-manufacturing'], ['welding-and-assembly', 'surface-treatment-and-finishing'], 'standard'],
    ['Tubular Machine Guards', 'SW-TB-002', 'Tubular guards and safety frames for machines, conveyors, and service areas.', 'Tubular Products', ['industrial-manufacturing', 'maintenance-and-repair-services'], ['welding-and-assembly'], 'custom'],
  ] as const

  const productMap = new Map<string, SeedDoc>()
  for (const [index, seed] of productSeeds.entries()) {
    const [title, sku, summary, familyTitle, industrySlugs, capabilitySlugs, productType] = seed
    const family = familyMap.get(slugify(familyTitle))
    const accent = familyTitle.includes('Aviation') || familyTitle.includes('ULD') ? '#2453d4' : '#f6c500'
    const rich = productRichContent[sku]

    const image = rich?.featuredImage
      ? await ensureMedia(payload, path.join(productImageDir, rich.featuredImage), `${title} product image`)
      : await ensureMedia(payload, await writeProductImage(title, sku, familyTitle, accent), `${title} product image`)

    const gallery = rich?.gallery
      ? await Promise.all(
          rich.gallery.map(async (file, viewIndex) => ({
            image: (
              await ensureMedia(payload, path.join(productImageDir, file), `${title} view ${viewIndex + 1}`)
            ).id,
          })),
        )
      : undefined

    const howItWorks = rich?.howItWorks
      ? {
          caption: rich.howItWorks.caption,
          heading: rich.howItWorks.heading,
          image: (
            await ensureMedia(
              payload,
              path.join(productImageDir, rich.howItWorks.image),
              `${title} how it works`,
            )
          ).id,
        }
      : undefined

    const technicalDrawing = rich?.technicalDrawing
      ? (
          await ensureMedia(
            payload,
            path.join(productImageDir, rich.technicalDrawing),
            `${title} technical drawing`,
          )
        ).id
      : undefined

    const isConfigurable = productType === 'configurable'
    const doc = await upsertBySlug(payload, 'products', {
      _status: 'published',
      accessories: rich?.accessories,
      breadcrumb: rich?.breadcrumb,
      capabilities: ids(capabilitySlugs, capabilityMap),
      categoryLabel: rich?.categoryLabel,
      configurationOptions:
        rich?.configurationOptions ??
        (isConfigurable
          ? [
              {
                group: 'Module Layout',
                options: [
                  { label: 'Straight', value: 'straight' },
                  { label: 'Curved', value: 'curved' },
                  { label: 'Transfer', value: 'transfer' },
                ],
              },
              {
                group: 'Finish',
                options: [
                  { label: 'Industrial paint', value: 'paint' },
                  { label: 'Powder coated', value: 'powder-coated' },
                  { label: 'Galvanized', value: 'galvanized' },
                ],
              },
            ]
          : undefined),
      description: rich?.description,
      dimensions: { notes: 'Dimensions configurable by drawing, sample, or project requirement.' },
      featuredImage: image.id,
      gallery,
      howItWorks,
      industries: ids(industrySlugs, industryMap),
      industryLabel: rich?.industryLabel,
      isConfigurable,
      keySpecs: rich?.keySpecs,
      loadCapacity: familyTitle.includes('Aviation') ? 'Project and aircraft specific' : 'By requirement',
      productFamily: family?.id,
      productType,
      sku,
      slug: slugify(title),
      specifications: rich?.specifications ?? [
        { label: 'Manufacturing route', value: familyTitle },
        { label: 'Finish', value: 'Painted, powder-coated, galvanized, or stainless finish' },
        { label: 'Source input', value: 'Drawing, sample, concept, or problem statement' },
      ],
      summary,
      surfaceTreatment: 'Industrial painting, powder coating, galvanizing, or customer-specific finishing available.',
      technicalDrawing,
      title,
    })
    productMap.set(slugify(title), doc)
    process.stdout.write(`Seeded product ${index + 1}/${productSeeds.length}: ${title}\n`)
  }

  const brochureCover = await ensureMedia(
    payload,
    await writeProductImage('Sky Wings Catalogue', 'PDF', 'Downloadable brochure', '#2453d4'),
    'Sky Wings brochure cover',
  )

  const brochureSeeds = [
    ['Sky Wings Company Profile', 'company-profile', 'Overview of Sky Wings Engineering Industries LLC, locations, capabilities, sectors served, and end-to-end manufacturing approach.'],
    ['GSE Product Catalogue', 'product-catalogue', 'Starter aviation ground support equipment catalogue with ladders, stands, dollies, carts, bowsers, ULD products, and cargo systems.'],
    ['Manufacturing Capabilities Brochure', 'capability-brochure', 'Capability overview for CNC machining, sheet metal processing, fabrication, welding, assembly, and surface treatment.'],
    ['Industrial Products Catalogue', 'product-catalogue', 'Industrial product families including machine frames, conveyor structures, guards, platforms, racks, and tubular systems.'],
    ['Aviation GSE Technical Datasheets', 'technical-data-sheet', 'Technical datasheet starter pack for aviation maintenance platforms, cargo handling, dollies, carts, and support equipment.'],
  ] as const

  const brochureDocs: SeedDoc[] = []
  for (const [title, brochureType, summary] of brochureSeeds) {
    const filePath = await writePdf(slugify(title), title, [
      'Dummy downloadable PDF for the Sky Wings Payload starter catalogue.',
      summary,
      'Replace this file in Payload when the final brochure is ready.',
    ])
    const doc = await ensureBrochure(
      payload,
      {
        brochureType,
        capabilities: Array.from(capabilityMap.values()).slice(0, 6).map((item) => item.id),
        coverImage: brochureCover.id,
        industries: Array.from(industryMap.values()).slice(0, 6).map((item) => item.id),
        isPublic: true,
        products: Array.from(productMap.values()).slice(0, 18).map((item) => item.id),
        requiresLeadCapture: false,
        slug: slugify(title),
        summary,
        title,
      },
      filePath,
    )
    brochureDocs.push(doc)
  }

  await Promise.all(
    Array.from(productMap.values()).map((product) =>
      payload.update({
        collection: 'products',
        data: {
          brochures: brochureDocs.map((brochure) => brochure.id),
        },
        id: product.id,
        overrideAccess: true,
      }),
    ),
  )

  await fs.rm(tmpDir, { force: true, recursive: true })

  const result = {
    brochures: brochureDocs.length,
    capabilities: capabilityMap.size,
    industries: industryMap.size,
    productFamilies: familyMap.size,
    products: productMap.size,
  }

  process.stdout.write(
    `Seed complete: ${result.capabilities} capabilities, ${result.industries} industries, ${result.productFamilies} families, ${result.products} products, ${result.brochures} brochures.\n`,
  )

  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDummyCatalog().catch(async (error) => {
    console.error(error)
    await fs.rm(tmpDir, { force: true, recursive: true })
    process.exit(1)
  })
}
