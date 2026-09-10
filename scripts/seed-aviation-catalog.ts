/**
 * Recategorises the Aviation Ground Support Equipment catalogue.
 *
 * The GSE range had been spread across families that describe manufacturing
 * processes rather than aviation use -- beverage and meal carts under "Sheet
 * Metal Products", the gantry crane under "Industrial Solutions" -- and only
 * half the printed catalogue existed as Product documents at all.
 *
 * This seeds six aviation families, files every catalogue item into one, and
 * creates the entries that were missing. Products are matched on SKU, so
 * re-running only moves families and fills gaps; it never duplicates a row.
 *
 * The old catch-all "Aviation Ground Support Equipment" family is left in
 * place but has its industryFocus cleared, which drops it out of the Products
 * menu without deleting a document anything might still reference.
 *
 *   pnpm run seed:aviation-catalog
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

const INDUSTRY_SLUG = 'aviation-ground-support-equipment'
const LEGACY_FAMILY_SLUG = 'aviation-ground-support-equipment'

const CONVEYORS = 'conveyors-and-loaders'
const ACCESS = 'access-and-maintenance-equipment'
const CARGO = 'cargo-and-baggage-handling'
const ENGINE = 'engine-lifting-and-servicing'
const CABIN = 'passenger-and-cabin-service'
const ULD = 'uld-containers-and-pallets'

const FAMILIES = [
  {
    slug: CONVEYORS,
    title: 'Conveyors & Loaders',
    summary:
      'Powered and modular conveyor systems, pallet dispensers and belt loaders for moving cargo between ramp and aircraft hold.',
    sortOrder: 1,
  },
  {
    slug: ACCESS,
    title: 'Access & Maintenance Equipment',
    summary:
      'Ladders, stairs, docks and adjustable stands that put engineers safely alongside every serviceable area of the airframe.',
    sortOrder: 2,
  },
  {
    slug: CARGO,
    title: 'Cargo & Baggage Handling',
    summary:
      'Dollies, racks and carts for moving ULDs, pallets, baggage and mail across the apron.',
    sortOrder: 3,
  },
  {
    slug: ENGINE,
    title: 'Engine, Lifting & Servicing',
    summary:
      'Engine stands, gantry cranes, bowsers and wheel-handling equipment for line and base maintenance.',
    sortOrder: 4,
  },
  {
    slug: CABIN,
    title: 'Passenger & Cabin Service',
    summary:
      'Galley trolleys, catering carts and terminal equipment built to airline cabin service standards.',
    sortOrder: 5,
  },
  {
    slug: ULD,
    title: 'ULD Containers & Pallets',
    summary:
      'Certified unit load devices, air cargo pallets and restraint nets for widebody and narrowbody loading.',
    sortOrder: 6,
  },
]

type Entry = { sku: string; title: string; summary: string; family: string }

const CATALOG: Entry[] = [
  {
    sku: 'GSE-RC',
    title: 'Modular Conveyor System',
    family: CONVEYORS,
    summary:
      'Configurable conveyor solution including straight, curved, belt, and transfer modules for cargo systems.',
  },
  {
    sku: 'GSE-IC380-032',
    title: 'Inline Conveyor 380V',
    family: CONVEYORS,
    summary: 'Powered inline roller conveyor for heavy component transfer tasks.',
  },
  {
    sku: 'GSE-RC380-033',
    title: 'Rotator Conveyor 380V',
    family: CONVEYORS,
    summary: 'Powered rotating conveyor for directional cargo transfer and positioning.',
  },
  {
    sku: 'GSE-PD-034',
    title: 'Pallet Dispenser',
    family: CONVEYORS,
    summary: 'Automated pallet dispenser for controlled pallet feeding and handling.',
  },
  {
    sku: 'GSE-TBL-035',
    title: 'Towable Belt Loader',
    family: CONVEYORS,
    summary: 'Towable belt loader for aircraft baggage and cargo loading.',
  },

  {
    sku: 'GSE-SL-036',
    title: 'Straight Ladders',
    family: ACCESS,
    summary: 'Straight maintenance ladders for safe elevated aircraft access work.',
  },
  {
    sku: 'GSE-CPL-037',
    title: 'Cowl Pylon Ladders',
    family: ACCESS,
    summary: 'Specialized ladders for aircraft cowl and pylon maintenance access.',
  },
  {
    sku: 'GSE-FS-038',
    title: 'Folding Stand',
    family: ACCESS,
    summary: 'Compact folding platform for portable aircraft maintenance access tasks.',
  },
  {
    sku: 'GSE-CS-039',
    title: 'Cargo Stairs',
    family: ACCESS,
    summary: 'Compact cargo stairs for safe aircraft servicing and access.',
  },
  {
    sku: 'GSE-MS-040',
    title: 'Maintenance Stair',
    family: ACCESS,
    summary: 'Mobile maintenance stair for safe aircraft inspection and servicing.',
  },
  {
    sku: 'GSE-MAS-041',
    title: 'Maintenance Access Stair',
    family: ACCESS,
    summary: 'Elevated access stair for larger aircraft maintenance work zones.',
  },
  {
    sku: 'GSE-PSD-042',
    title: 'Propeller Stand',
    family: ACCESS,
    summary: 'Stable propeller stand for aircraft propeller maintenance and display.',
  },
  {
    sku: 'GSE-HMS-043',
    title: 'Hydraulic Maintenance Steps',
    family: ACCESS,
    summary: 'Hydraulic maintenance steps for adjustable aircraft support work.',
  },
  {
    sku: 'GSE-WMP-044',
    title: 'Windshield Maintenance Platform',
    family: ACCESS,
    summary: 'Services aircraft windshield areas safely.',
  },
  {
    sku: 'GSE-B1MS-045',
    title: 'B1 - Maintenance Stand',
    family: ACCESS,
    summary: 'Adjustable B1 stand for high-level aircraft maintenance access.',
  },
  {
    sku: 'GSE-B4MS-046',
    title: 'B4 - Maintenance Stand',
    family: ACCESS,
    summary: 'Scissor-lift B4 stand for compact elevated maintenance access.',
  },
  {
    sku: 'GSE-B5MS-047',
    title: 'B5 - Maintenance Stand',
    family: ACCESS,
    summary: 'B5 maintenance stand for elevated component servicing and inspection.',
  },
  {
    sku: 'GSE-MP-048',
    title: 'Maintenance Platform',
    family: ACCESS,
    summary: 'Mobile aircraft platform for PAX door and cockpit access.',
  },
  {
    sku: 'GSE-UTD-049',
    title: 'Universal Tail Dock',
    family: ACCESS,
    summary: 'Universal tail dock for aircraft tail and stabilizer maintenance.',
  },

  {
    sku: 'GSE-FBT-005',
    title: 'Flatbed Trolley',
    family: CARGO,
    summary: 'Carries heavy cargo and baggage loads.',
  },
  {
    sku: 'GSE-CDD-006',
    title: 'Caster Deck Dolly',
    family: CARGO,
    summary: 'Handles ULD containers with caster deck. Supports LD1, LD2 and LD3.',
  },
  {
    sku: 'GSE-RDD-007',
    title: 'Roller Deck Dolly',
    family: CARGO,
    summary: 'Roller-deck dolly for controlled ULD cargo transfer operations.',
  },
  {
    sku: 'GSE-3CD-008',
    title: '3 Container Dolly',
    family: CARGO,
    summary: 'Extended roller dolly for carrying three LD3 containers together.',
  },
  {
    sku: 'GSE-SRR-009',
    title: 'Static Roller Rack',
    family: CARGO,
    summary: 'Fixed roller rack for gravity-assisted cargo transfer operations.',
  },
  {
    sku: 'GSE-SPR-010',
    title: 'Slave Pallet Rack',
    family: CARGO,
    summary: 'Low-profile slave pallet rack for ULD and pallet transfer.',
  },
  {
    sku: 'GSE-LD3D-011',
    title: 'LD3 Container Dolly',
    family: CARGO,
    summary: 'Compact LD3 dolly for safe single-container ramp movement.',
  },
  {
    sku: 'GSE-ULDR-012',
    title: 'ULD Rack',
    family: CARGO,
    summary: 'Mobile storage rack for organizing ULD containers and equipment.',
  },
  {
    sku: 'GSE-HSS-013',
    title: 'Helicopter Shoring Stand',
    family: CARGO,
    summary: 'Stable helicopter shoring stand for cowl and pylon support.',
  },
  {
    sku: 'GSE-OBC-003',
    title: 'Open Baggage Cart',
    family: CARGO,
    summary: 'Transports loose baggage on airport ramps.',
  },
  {
    sku: 'GSE-CBC-004',
    title: 'Close Baggage Cart',
    family: CARGO,
    summary: 'Protects baggage during ramp transport.',
  },
  {
    sku: 'GSE-CMC-025',
    title: 'Cargo Mail Cart',
    family: CARGO,
    summary: 'Wire cargo mail cart for airport mail and baggage handling.',
  },
  {
    sku: 'GSE-ASLC-024',
    title: 'Air Supply Loading Cart',
    family: CARGO,
    summary: 'Lightweight service cart for aircraft cabin supply loading tasks.',
  },

  {
    sku: 'GSE-TES-014',
    title: 'Twinpack Engine Stand',
    family: ENGINE,
    summary: 'Twin engine stand for secure aircraft engine movement support.',
  },
  {
    sku: 'GSE-GCP-015',
    title: 'Gantry Crane Portable',
    family: ENGINE,
    summary: 'Portable gantry crane for flexible workshop lifting operations.',
  },
  {
    sku: 'GSE-GCL-016',
    title: 'Gantry Crane Large',
    family: ENGINE,
    summary: 'Large gantry crane for high-capacity aircraft component lifting.',
  },
  {
    sku: 'GSE-ES-001-2-3',
    title: 'Engine Support',
    family: ENGINE,
    summary: 'Adjustable engine support stands for secure aircraft engine maintenance handling.',
  },
  {
    sku: 'GSE-DA-001-2-3',
    title: 'Dolly Accessories',
    family: ENGINE,
    summary: 'Locking and handling accessories for aircraft cargo dolly operations.',
  },
  {
    sku: 'GSE-WB-017',
    title: 'Water Bowser',
    family: ENGINE,
    summary: 'Towable water bowser for aircraft potable water servicing operations.',
  },
  {
    sku: 'GSE-FB-018',
    title: 'Fuel Bowser',
    family: ENGINE,
    summary: 'Towable fuel bowser for controlled aircraft fuel service support.',
  },
  {
    sku: 'GSE-OC-019',
    title: 'Oxygen Cart',
    family: ENGINE,
    summary: 'Mobile oxygen cylinder cart for aircraft servicing and maintenance.',
  },
  {
    sku: 'GSE-TR-020',
    title: 'Transfer Ramp',
    family: ENGINE,
    summary: 'Portable transfer ramp for safe cargo loading transitions.',
  },
  {
    sku: 'GSE-TR-67',
    title: 'Tire Racks',
    family: ENGINE,
    summary: 'Storage racks for organised handling of aircraft wheels and tires.',
  },
  {
    sku: 'GSE-TTHL-021',
    title: 'Tire Trolley with Hydraulic Lift',
    family: ENGINE,
    summary: 'Hydraulic tire trolley for lifting and positioning aircraft wheels.',
  },
  {
    sku: 'GSE-TT-022',
    title: 'Tire Trailer',
    family: ENGINE,
    summary: 'Towable trailer for transporting aircraft wheels and tire assemblies.',
  },
  {
    sku: 'GSE-TC-023',
    title: 'Tire Cart',
    family: ENGINE,
    summary: 'Enclosed tire cart for organized aircraft tire handling support.',
  },

  {
    sku: 'GSE-LT-057',
    title: 'Luggage Trolley',
    family: CABIN,
    summary: 'Compact airport luggage trolley for smooth passenger baggage handling.',
  },
  {
    sku: 'GSE-LT-058',
    title: 'Luggage Trolley - Heavy Duty',
    family: CABIN,
    summary: 'Heavy-duty luggage trolley for reliable baggage transport operations.',
  },
  {
    sku: 'GSE-SC-059',
    title: 'Shopping Cart',
    family: CABIN,
    summary: 'Curved shopping cart for passenger terminal retail convenience.',
  },
  {
    sku: 'GSE-FTT-060',
    title: 'Folding Table Trolley',
    family: CABIN,
    summary: 'Foldable service table trolley for inflight and airport operations.',
  },
  {
    sku: 'GSE-WTH-061',
    title: 'Waste Trolley - Half Size',
    family: CABIN,
    summary: 'Half-size aircraft waste trolley for compact cabin garbage handling.',
  },
  {
    sku: 'GSE-WTF-062',
    title: 'Waste Trolley - Full Size',
    family: CABIN,
    summary: 'Full-size airline waste trolley for high-volume cabin rubbish collection.',
  },
  {
    sku: 'GSE-BC-063',
    title: 'Beverage Cart',
    family: CABIN,
    summary: 'Aluminum beverage cart for organized inflight drink service storage.',
  },
  {
    sku: 'GSE-MCH-064',
    title: 'Meal Cart - Half Size',
    family: CABIN,
    summary: 'Half-size meal cart for compact aircraft galley catering service.',
  },
  {
    sku: 'GSE-MCF-065',
    title: 'Meal Cart - Full Size',
    family: CABIN,
    summary: 'Full-size inflight meal cart for aircraft catering operations.',
  },
  {
    sku: 'GSE-AOR-026',
    title: 'Airline Oven Rack',
    family: CABIN,
    summary: 'Aluminum oven rack for aircraft galley meal preparation storage.',
  },
  {
    sku: 'GSE-TCD-027',
    title: 'Trolley Cart Drawer',
    family: CABIN,
    summary: 'Aluminium ATLAS drawer for aircraft galley trolley storage.',
  },
  {
    sku: 'GSE-FBC-028',
    title: 'Food Box Container',
    family: CABIN,
    summary: 'Compact aluminum food box for inflight catering storage.',
  },
  {
    sku: 'GSE-MT-029',
    title: 'Meal Tray',
    family: CABIN,
    summary: 'Lightweight meal tray for airline catering and inflight service.',
  },

  {
    sku: 'GSE-ULDC-01-13',
    title: 'ULD Containers',
    family: ULD,
    summary:
      'Unit load devices covering LD1, LD2, LD3, LD3-45, LD4, LD6, LD7, LD8, LD9, LD11, LD26, LD29 and M-1H.',
  },
  {
    sku: 'GSE-PAG-P1-051',
    title: 'PAG P1 2A4P Pallet',
    family: ULD,
    summary: 'Standard PAG air cargo pallet for widebody aircraft loading.',
  },
  {
    sku: 'GSE-PMC-P6-052',
    title: 'PMC P6 2M3P Pallet',
    family: ULD,
    summary: 'Heavy-duty PMC pallet for widebody air cargo operations.',
  },
  {
    sku: 'GSE-PLA-P9-053',
    title: 'PLA P9 2L3P Pallet',
    family: ULD,
    summary: 'Compact PLA pallet for smaller air cargo handling requirements.',
  },
  {
    sku: 'GSE-FQA-P8-054',
    title: 'FQA P8 Pallet',
    family: ULD,
    summary: 'FQA aircraft pallet for compact cargo loading operations.',
  },
  {
    sku: 'GSE-PKC-055',
    title: 'PKC 2K3P Pallet',
    family: ULD,
    summary: 'PKC pallet for compact ULD and cargo handling support.',
  },
  {
    sku: 'GSE-PN-056',
    title: 'Pallet Net',
    family: ULD,
    summary: 'Cargo pallet net for securing freight during aircraft transport.',
  },
]

const formatSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const payload = await getPayload({ config })

const industry = await payload.find({
  collection: 'industries',
  where: { slug: { equals: INDUSTRY_SLUG } },
  depth: 0,
  limit: 1,
})
const industryId = (industry.docs[0] as { id: number } | undefined)?.id

if (!industryId) {
  throw new Error('Aviation industry not found; nothing to attach families to.')
}

const familyIdBySlug = new Map<string, number>()

for (const family of FAMILIES) {
  const existing = await payload.find({
    collection: 'product-families',
    where: { slug: { equals: family.slug } },
    depth: 0,
    limit: 1,
  })
  const data = {
    title: family.title,
    slug: family.slug,
    summary: family.summary,
    sortOrder: family.sortOrder,
    industryFocus: [industryId],
    _status: 'published' as const,
  }

  if (existing.docs.length) {
    const id = (existing.docs[0] as { id: number }).id
    await payload.update({ collection: 'product-families', id, data })
    familyIdBySlug.set(family.slug, id)
    console.log('family updated:', family.title)
  } else {
    const doc = await payload.create({ collection: 'product-families', data })
    familyIdBySlug.set(family.slug, (doc as { id: number }).id)
    console.log('family created:', family.title)
  }
}

let created = 0
let refiled = 0
let unchanged = 0

for (const entry of CATALOG) {
  const familyId = familyIdBySlug.get(entry.family)
  const existing = await payload.find({
    collection: 'products',
    where: { sku: { equals: entry.sku } },
    depth: 0,
    limit: 1,
  })

  if (existing.docs.length) {
    const doc = existing.docs[0] as {
      id: number
      industries?: unknown
      productFamily?: number | null
    }
    const industries = Array.isArray(doc.industries) ? (doc.industries as number[]) : []
    const needsIndustry = !industries.includes(industryId)

    if (doc.productFamily === familyId && !needsIndustry) {
      unchanged += 1
      continue
    }

    await payload.update({
      collection: 'products',
      id: doc.id,
      data: {
        industries: needsIndustry ? [...industries, industryId] : industries,
        productFamily: familyId,
      },
    })
    refiled += 1
    console.log('refiled:', entry.sku, '->', entry.family)
    continue
  }

  await payload.create({
    collection: 'products',
    data: {
      _status: 'published',
      industries: [industryId],
      productFamily: familyId,
      productType: 'standard',
      sku: entry.sku,
      slug: formatSlug(entry.title),
      summary: entry.summary,
      title: entry.title,
    },
  })
  created += 1
  console.log('created:', entry.sku, entry.title)
}

// Drop the catch-all family out of the Products menu without deleting a
// document that older content may still reference.
if (!familyIdBySlug.has(LEGACY_FAMILY_SLUG)) {
  const legacy = await payload.find({
    collection: 'product-families',
    where: { slug: { equals: LEGACY_FAMILY_SLUG } },
    depth: 0,
    limit: 1,
  })

  if (legacy.docs.length) {
    await payload.update({
      collection: 'product-families',
      id: (legacy.docs[0] as { id: number }).id,
      data: { industryFocus: [] },
    })
    console.log('legacy catch-all family removed from the Products menu')
  }
}

console.log('')
console.log('created ' + created + ' | refiled ' + refiled + ' | already correct ' + unchanged)

process.exit(0)
