/**
 * The product catalogue's shape: what families exist, and which industries
 * each one serves.
 *
 * This is the single source for the seed scripts and the tests that guard
 * them. It is deliberately out of the request path -- the site reads families
 * from Payload so editors stay in control. What this module fixes is the
 * shape the seeds write, which is where the Products mega menu gets content.
 *
 * Why it exists: the dummy seed gave every non-aviation family
 * `industries.slice(0, 4)` as its focus, so five of the six menu columns
 * listed an identical eight families, and Industrial Manufacturing -- the
 * industry those families actually serve -- was missing from the menu.
 *
 * Adding a product later should not need a code change: file it under an
 * existing family and it appears wherever that family is focused. Add a new
 * family here only when a product genuinely has nowhere to live.
 */

export type ProductFamilySeed = {
  /** Menu label. */
  title: string
  slug: string
  /** Shown on family cards and the /products listing. */
  summary: string
  /**
   * Global sort key. Generic families occupy 10-199 and aviation 200+, so the
   * two sets cannot interleave inside a column the way 1-9 and 1-6 did.
   */
  sortOrder: number
}

/**
 * Families a product can be filed under. Deliberately narrower than the old
 * catch-alls: "Industrial Solutions" held machine frames, storage racks,
 * access platforms, piping supports and gates all at once,
 * which made it useless as a menu entry and left nowhere obvious to file the
 * next product.
 */
export const PRODUCT_FAMILIES: readonly ProductFamilySeed[] = [
  {
    slug: 'material-handling-and-conveying',
    title: 'Material Handling & Conveying',
    summary:
      'Modular straight, curved, roller and belt conveyor systems, transfer modules, ramps and powered handling equipment for production and cargo lines.',
    sortOrder: 10,
  },
  {
    slug: 'storage-and-workstation-systems',
    title: 'Storage & Workstation Systems',
    summary:
      'Storage racks, shelving, part trolleys, carts and workbenches that organise production floors, stores and assembly bays.',
    sortOrder: 20,
  },
  {
    slug: 'machine-frames-and-bases',
    title: 'Machine Frames & Base Structures',
    summary:
      'Machine frames, skids, base frames, mounting systems and support structures engineered to carry plant equipment.',
    sortOrder: 30,
  },
  {
    slug: 'precision-machined-components',
    title: 'Precision Machined Components',
    summary:
      'Shafts, rollers, couplings, bushings, pins, hubs, flanges and custom machined parts turned and milled to drawing.',
    sortOrder: 40,
  },
  {
    slug: 'sheet-metal-products',
    title: 'Sheet Metal Products',
    summary:
      'Laser-cut and formed panels, enclosures, cabinets, housings, guards, covers and brackets.',
    sortOrder: 50,
  },
  {
    slug: 'heavy-fabrication-and-structural-steel-works',
    title: 'Heavy Fabrication & Structural Steel Works',
    summary:
      'Structural steel frameworks, platforms, walkways, mezzanines, heavy skids and engineered fabricated assemblies.',
    sortOrder: 60,
  },
  {
    slug: 'access-platforms-and-safety-structures',
    title: 'Access Platforms & Safety Structures',
    summary:
      'Maintenance platforms, access stairs, ladders, safety cages, machine guarding and protective structures that keep people safe around plant.',
    sortOrder: 70,
  },
  {
    slug: 'tubular-products',
    title: 'Tubular Products',
    summary:
      'Handrails, safety barriers, bollards, tubular guards, frames and stainless tubular assemblies.',
    sortOrder: 80,
  },
  {
    slug: 'heavy-machinery-components',
    title: 'Heavy Machinery Components',
    summary:
      'Chassis and boom weldments, counterweights, wear plates, guards and structural components fabricated for heavy plant and mobile equipment builders.',
    sortOrder: 65,
  },
  {
    slug: 'architectural-and-interior-metal-works',
    title: 'Architectural & Interior Metal Works',
    summary:
      'Stainless railings, decorative partitions, staircases, pergolas, canopies and furniture frames for finished spaces.',
    sortOrder: 90,
  },
  {
    slug: 'doors-gates-and-enclosures',
    title: 'Doors, Gates & Enclosures',
    summary:
      'Metal doors, gates, louvres, hatches, plant enclosures and access covers fabricated to opening size.',
    sortOrder: 100,
  },
  {
    slug: 'process-equipment-and-piping-supports',
    title: 'Process Equipment & Piping Supports',
    summary:
      'Tanks, cylindrical shells, vessels, pipe spools, process piping supports and corrosion-resistant process assemblies.',
    sortOrder: 110,
  },
  {
    slug: 'surface-treated-products',
    title: 'Surface-Treated Products',
    summary:
      'Industrially painted, powder-coated, galvanized and corrosion-resistant finished products.',
    sortOrder: 120,
  },

  // Aviation GSE keeps its own families: the range is bought by role on the
  // apron, not by the process that made it.
  {
    slug: 'conveyors-and-loaders',
    title: 'Conveyors & Loaders',
    summary:
      'Powered and modular conveyor systems, pallet dispensers and belt loaders for moving cargo between ramp and aircraft hold.',
    sortOrder: 200,
  },
  {
    slug: 'cargo-and-baggage-handling',
    title: 'Cargo & Baggage Handling',
    summary:
      'Dollies, racks and carts for moving ULDs, pallets, baggage and mail across the apron.',
    sortOrder: 210,
  },
  /*
   * Containers and pallets were one family until the range grew to a product
   * per container type. They are bought separately -- a container by its
   * contour, a pallet and its net by base size -- so they file separately.
   */
  {
    slug: 'uld-containers',
    title: 'ULD Containers',
    summary: 'Lower-deck and main-deck unit load devices, LD1 through LD29 and M-1H.',
    sortOrder: 220,
  },
  {
    slug: 'pallets-and-nets',
    title: 'Pallets & Nets',
    summary: 'Air cargo pallets and the restraint nets that secure freight on them.',
    sortOrder: 225,
  },
  {
    slug: 'access-and-maintenance-equipment',
    title: 'Access & Maintenance Equipment',
    summary:
      'Ladders, stairs, docks and adjustable stands that put engineers safely alongside every serviceable area of the airframe.',
    sortOrder: 230,
  },
  {
    slug: 'engine-lifting-and-servicing',
    title: 'Engine, Lifting & Servicing',
    summary:
      'Engine stands, gantry cranes, bowsers and wheel-handling equipment for line and base maintenance.',
    sortOrder: 240,
  },
  {
    slug: 'passenger-and-cabin-service',
    title: 'Passenger & Cabin Service',
    summary:
      'Meal and beverage carts, galley containers, waste trolleys and passenger-facing cabin service equipment.',
    sortOrder: 250,
  },
]

/**
 * Which families each industry buys. An industry's column in the Products
 * mega menu is exactly this list, ordered by the family `sortOrder` above.
 *
 * Overlap is expected and correct -- sheet metal really is bought by five of
 * these industries -- but no two columns are identical, and each leads with
 * what that industry actually comes here for.
 */
export const INDUSTRY_FAMILY_FOCUS: Readonly<Record<string, readonly string[]>> = {
  'aviation-ground-support-equipment': [
    'conveyors-and-loaders',
    'cargo-and-baggage-handling',
    'uld-containers',
    'pallets-and-nets',
    'access-and-maintenance-equipment',
    'engine-lifting-and-servicing',
    'passenger-and-cabin-service',
  ],
  'industrial-manufacturing': [
    'material-handling-and-conveying',
    'storage-and-workstation-systems',
    'machine-frames-and-bases',
    'precision-machined-components',
    'sheet-metal-products',
    'access-platforms-and-safety-structures',
    'tubular-products',
    // Re-homed from Oil & Gas and Marine when those columns came off the
    // menu: tanks, vessels and piping supports are bought by process plants
    // too, and this keeps the family (and its products) reachable.
    'process-equipment-and-piping-supports',
  ],
  'construction-and-infrastructure': [
    'heavy-fabrication-and-structural-steel-works',
    'access-platforms-and-safety-structures',
    'tubular-products',
    'architectural-and-interior-metal-works',
    'doors-gates-and-enclosures',
    'surface-treated-products',
  ],
  'heavy-equipment-and-machinery': [
    'heavy-machinery-components',
    'machine-frames-and-bases',
    'precision-machined-components',
    'sheet-metal-products',
    'heavy-fabrication-and-structural-steel-works',
    'surface-treated-products',
  ],
  'architectural-and-interior-metalwork': [
    'architectural-and-interior-metal-works',
    'tubular-products',
    'doors-gates-and-enclosures',
    'sheet-metal-products',
    'surface-treated-products',
  ],
  /*
   * Four published industries are deliberately absent, so the menu stays at
   * five columns aimed at the sectors the catalogue actually serves:
   *
   *   Maintenance & Repair Services -- repair, refurbishment and spares are
   *     sold as a service, not as a product family.
   *   Oil & Gas, Marine & Offshore -- served through the same fabrication
   *     families as the sectors above, with no distinct product range yet.
   *   Custom Metal Fabrication -- a way of working rather than a sector; its
   *     column was a strict subset of the others.
   *
   * All four keep their industry documents and pages. Giving one a column
   * again means adding its key back here and re-running the seed.
   */
}

/**
 * Families that leave the catalogue entirely rather than being replaced by
 * another one. Repair, refurbishment and spares are a service offering, so
 * they belong in their own section instead of the product taxonomy.
 *
 * The seed deletes these only when no product is filed under them; a family
 * still holding products is left alone and reported, so nothing disappears
 * from the catalogue without someone deciding where it should go.
 */
export const REMOVED_FAMILIES: readonly string[] = [
  'repair-refurbishment-and-spares',
  // Existed only to give the Custom Metal Fabrication column an identity of
  // its own; that column is off the menu, and the family held no products.
  'custom-engineered-assemblies',
]

/**
 * Industries the catalogue no longer sells into. The taxonomy seed strips them
 * from every product's `industries`, so they stop appearing as a filter on
 * /products.
 *
 * Maintenance & Repair Services keeps its sector page — it is sold as a
 * service. Oil & Gas and Marine & Offshore are retired outright by
 * `pnpm run retire:industries`, which unpublishes both the industry and its
 * page; they are listed here so a taxonomy re-run cannot re-tag a product with
 * a sector that is no longer served.
 */
export const NON_PRODUCT_INDUSTRIES: readonly string[] = [
  'maintenance-and-repair-services',
  'oil-and-gas',
  'marine-and-offshore',
]

/**
 * Families kept as documents but dropped from every menu, mapped to where
 * their products now belong. Clearing `industryFocus` rather than deleting
 * leaves anything that still references them intact.
 */
export const SUPERSEDED_FAMILIES: Readonly<Record<string, string>> = {
  // Split apart: a bucket for anything that was not obviously aviation.
  'industrial-solutions': 'machine-frames-and-bases',
  // One product line, not a family -- it belongs inside Material Handling.
  'modular-conveyor-system': 'material-handling-and-conveying',
  // The old catch-all, superseded by the six aviation families.
  'aviation-ground-support-equipment': 'conveyors-and-loaders',
  // Split in two. Containers are the default home; pallets and nets are
  // moved on by SKU (PALLET_AND_NET_SKUS below).
  'uld-containers-and-pallets': 'uld-containers',
}

/**
 * The pallets and the net from the old combined ULD family, which belong in
 * Pallets & Nets rather than in its successor.
 */
export const PALLET_AND_NET_SKUS: readonly string[] = [
  'GSE-PAG-P1-051',
  'GSE-PMC-P6-052',
  'GSE-PLA-P9-053',
  'GSE-FQA-P8-054',
  'GSE-PKC-055',
  'GSE-PN-056',
]

/** Family slugs a given industry focuses on. */
/**
 * Industries pinned to the front of every listing on the site -- the Products
 * menu, the catalogue sidebar, the landing page, the industry index.
 *
 * Aviation ground support is the range Sky Wings leads with, so it leads
 * everywhere rather than in one menu. Kept here rather than in each query so
 * the order cannot drift between surfaces, and out of the Industries
 * collection's own sortOrder so an editor's ordering of the rest still holds
 * underneath it.
 */
export const INDUSTRY_PRIORITY: readonly string[] = ['aviation-ground-support-equipment']

/** Lower sorts first. Everything unpinned shares the last rank, so a stable
 *  sort leaves the editor's sortOrder intact within it. */
export function industryRank(slug: string): number {
  const index = INDUSTRY_PRIORITY.indexOf(slug)

  return index === -1 ? INDUSTRY_PRIORITY.length : index
}

export function familiesForIndustry(industrySlug: string): readonly string[] {
  return INDUSTRY_FAMILY_FOCUS[industrySlug] ?? []
}

/** Industry slugs that focus on a family, inverted from the map above. */
export function industriesForFamily(familySlug: string): string[] {
  return Object.entries(INDUSTRY_FAMILY_FOCUS)
    .filter(([, families]) => families.includes(familySlug))
    .map(([industry]) => industry)
}
