/*
 * The capabilities page, as the company profile lays it out: each process,
 * the machines on the floor that run it, and what comes off them.
 *
 * These are the committed defaults. The live page reads the Capabilities and
 * Machines collections, and falls back to this only when the CMS has no
 * capabilities at all. `pnpm seed:capabilities` writes the same content into
 * the admin, which is where the photographs go -- none are committed here, so
 * every image field is null until one is uploaded against its record.
 *
 * Kept free of Payload imports so the seed script and a client component can
 * both import it.
 */

export type CapabilityImage = {
  alt: string
  /** A gallery entry's own caption, from the admin. */
  caption?: string | null
  url: string
}

export type CapabilityMachine = {
  brand: string | null
  capacity: string | null
  /** More photographs of the machine, after its featured one. */
  gallery: CapabilityImage[]
  id: string
  image: CapabilityImage | null
  /** What it is: "Laser machine", "Press brake". */
  machineType: string
  model: string | null
  summary: string | null
}

export type CapabilityOutput = {
  image: CapabilityImage | null
  label: string
}

export type CapabilityProcess = {
  /** More photographs of the process, after its featured one. */
  gallery: CapabilityImage[]
  id: string
  image: CapabilityImage | null
  machines: CapabilityMachine[]
  outputs: CapabilityOutput[]
  /** Anchor for the sub-navigation, so each process can be linked. */
  slug: string
  summary: string
  title: string
}

/** One photograph in a process's carousel, and what it shows. */
export type CapabilitySlide = {
  caption: string
  id: string
  /** Null for a machine whose photograph has not been uploaded yet. */
  image: CapabilityImage | null
  /**
   * `process`: the work itself, cropped to fill the frame. `machine`: a
   * machine photograph, contained -- a machine cut off at the edges says less
   * than a smaller one shown whole.
   */
  kind: 'machine' | 'process'
  /** Set on a machine's slides, so its row in the list can light up. */
  machineId: string | null
}

/**
 * A machine's description, as paragraphs. The admin's summary is one field;
 * a blank line in it starts a new paragraph, which is how the profile's
 * "what it is" and "what it is for" are kept apart.
 */
export function summaryParagraphs(summary: string | null) {
  return (summary ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** "Bodor · C-Series", or null when the admin has neither. */
export function machineMaker(machine: Pick<CapabilityMachine, 'brand' | 'model'>) {
  return [machine.brand, machine.model].filter(Boolean).join(' · ') || null
}

/*
 * Short names for the pinned sub-navigation, where every process has to fit
 * across one bar. The head's list and the bars keep the full titles; this is
 * only the bar's shorthand, keyed by slug so an edited title in the admin
 * still finds its short form.
 */
const processNavLabels: Record<string, string> = {
  'cnc-and-conventional-machining': 'Machining',
  'hydraulic-pressing': 'Pressing',
  'laser-cutting': 'Laser cutting',
  'plate-and-sheet-rolling': 'Rolling',
  'press-brake-forming': 'Press brake',
  'radial-and-heavy-drilling': 'Drilling',
  shearing: 'Shearing',
  'surface-treatment-and-finishing': 'Finishing',
  'welding-and-assembly': 'Welding',
}

/** The sub-navigation's name for a process; its full title when it has none. */
export function processNavLabel(process: Pick<CapabilityProcess, 'slug' | 'title'>) {
  return processNavLabels[process.slug] ?? process.title
}

/** "Bodor · C-Series — Laser machine": how a machine is named on a slide. */
export function machineLabel(machine: CapabilityMachine) {
  const maker = machineMaker(machine)
  return maker ? `${maker} — ${machine.machineType}` : machine.machineType
}

/**
 * Everything a process has to show, in reading order: the process at work
 * first, then its gallery, then each machine in list order with its own
 * photographs.
 *
 * Process photographs are skipped when missing -- the process is described
 * beside the carousel anyway. A machine is not: it always gets a slide, with
 * a placeholder until its photograph is uploaded, because the carousel is
 * where a machine's description is read, and a machine with no photo yet
 * still has one.
 */
export function buildCapabilitySlides(process: CapabilityProcess): CapabilitySlide[] {
  const processImages = [process.image, ...process.gallery].filter(
    (image): image is CapabilityImage => Boolean(image),
  )

  return [
    ...processImages.map((image, index) => ({
      caption: image.caption || process.title,
      id: `process-${index}`,
      image,
      kind: 'process' as const,
      machineId: null,
    })),
    ...process.machines.flatMap((machine) => {
      const images = [machine.image, ...machine.gallery].filter((image): image is CapabilityImage =>
        Boolean(image),
      )

      return (images.length ? images : [null]).map((image, index) => ({
        caption: image?.caption || machineLabel(machine),
        id: `machine-${machine.id}-${index}`,
        image,
        kind: 'machine' as const,
        machineId: machine.id,
      }))
    }),
  ]
}

/**
 * The seed's source for one process. `slug` must match the record the dummy
 * catalog seed already created, because products link to those records: the
 * seed updates them in place rather than creating a second set.
 */
export type CapabilityProcessSeed = {
  machines: Array<
    Omit<CapabilityMachine, 'gallery' | 'id' | 'image'> & {
      /**
       * Slugs this machine was seeded under before the profile's machine
       * pages corrected it. A record still under one is renamed in place
       * rather than left beside a duplicate.
       */
      previousSlugs?: string[]
      slug: string
    }
  >
  outputs: string[]
  processType:
    | 'machining'
    | 'sheet-metal'
    | 'fabrication'
    | 'welding'
    | 'bending-forming'
    | 'surface-treatment'
    | 'assembly'
    | 'engineering-design'
    | 'other'
  slug: string
  summary: string
  title: string
}

/*
 * Page copy. The live page reads these from the Pages collection ("capabilities"
 * page: the hero block for the head, the capability-listing block for the
 * closing band), so they stay editable; these are its defaults.
 */
export const defaultCapabilitiesCopy = {
  closingHeading: 'One accountable team.',
  closingStatement:
    'Because these services are integrated, a project does not move between multiple suppliers. The same team that plans the cutting also plans the machining, forming and welding.',
  description:
    'Our capabilities are defined by the breadth of processes we can perform and the range of material and size we can handle — allowing us to manufacture both small precision components and large fabricated structures.',
  eyebrow: 'Capability',
  heading: 'Process capabilities',
  primaryHref: '/contact',
  primaryLabel: 'Request a quote',
  secondaryHref: '/products',
  secondaryLabel: 'View products',
}

export type CapabilitiesCopy = typeof defaultCapabilitiesCopy

/*
 * Machines as the company profile's machine pages give them: brand, model,
 * what the machine is, what it does and what it is used for. Descriptions keep
 * the profile's wording, with its typos corrected ("MACHNINING", "DIRLL",
 * "MAHCINE"); a blank line in a summary starts a second paragraph -- the
 * profile's "what it is" and "what it is for".
 *
 * Two corrections against the profile's process pages, which disagree with
 * its machine pages: the shear is the VOX QC12Y-8X3200 and the press brake the
 * VOX VP16032 (the process pages had them swapped -- the model is printed on
 * each machine in its photograph, and QC12Y is a shear designation). The
 * hydraulic press's maker logo is not legible in the profile, so its brand is
 * left blank.
 */
export const capabilityProcessSeeds: readonly CapabilityProcessSeed[] = [
  {
    slug: 'laser-cutting',
    title: 'Laser Cutting',
    processType: 'sheet-metal',
    summary:
      'Fast, clean, high-accuracy profiling of sheet and plate for blanks, panels, guards, and complex geometries.',
    machines: [
      {
        slug: 'bodor-12k-c6100026-laser',
        previousSlugs: ['bodor-c-series-laser'],
        brand: 'Bodor',
        model: '12K-C6100026',
        machineType: 'Laser machine',
        summary:
          'Fully protective sheet laser cutting machine. Our workshop is equipped with the BODOR C, whose high-performance bus servo motors achieve leading dynamic performance and significantly improve processing efficiency.',
        capacity: 'Up to 1.5G acceleration',
      },
    ],
    outputs: [
      'Sheet metal blanks',
      'Mounting brackets',
      'Structural connection plates',
      'Cover plates',
      'Ventilation panels',
      'Complex geometries',
    ],
  },
  {
    slug: 'shearing',
    title: 'Shearing',
    processType: 'sheet-metal',
    summary:
      'Straight cutting for steel, aluminum, and stainless stock prepared for forming, machining, or fabrication.',
    machines: [
      {
        slug: 'vox-qc12y-8x3200-shear',
        previousSlugs: ['vox-vp16032-shear'],
        brand: 'VOX',
        model: 'QC12Y-8X3200',
        machineType: 'Shearing machine',
        summary:
          'A hydraulic sheet metal cutting machine designed to cut metal sheets and plates into specific sizes with accuracy and efficiency. A strong moving blade system delivers clean, straight cuts for fabrication and production work.\n\nIdeal for preparing steel, aluminum and other metal plates for GSE manufacturing, structural fabrication, panels, covers and custom industrial parts.',
        capacity: null,
      },
    ],
    outputs: ['Cut sheet blanks', 'Steel strips & flat bars', 'Fabrication-ready plate sets'],
  },
  {
    slug: 'cnc-and-conventional-machining',
    title: 'CNC & Conventional Machining',
    processType: 'machining',
    summary:
      'Precision turning, milling, drilling, and fixture work for shafts, rollers, flanges, bushings, and custom machine parts.',
    machines: [
      {
        slug: 'weida-amt-860-vmc',
        brand: 'WEIDA',
        model: 'AMT 860',
        machineType: 'Vertical machining center',
        summary:
          'A high-precision CNC machine designed for milling, drilling, tapping and boring. With X, Y and Z-axis movement, it delivers accurate, repeatable machining for metal and industrial components.\n\nIdeal for manufacturing complex parts, precision holes, slots, surfaces and custom components required in aviation, GSE and engineering fabrication.',
        capacity: null,
      },
      {
        slug: 'weida-amt-63-cnc-lathe',
        brand: 'WEIDA',
        model: 'AMT 63',
        machineType: 'CNC lathe',
        summary:
          'An automated, computer-controlled lathe for precision turning of metal and plastic workpieces. It rotates the workpiece while stationary cutting tools perform shaping, cutting, facing, threading, boring and finishing.\n\nSuitable for producing shafts, rollers, bushings, pins, hubs, couplings and custom precision parts for GSE and industrial equipment.',
        capacity: null,
      },
      {
        slug: 'hoston-c6280y-800x3000-lathe',
        previousSlugs: ['heavy-duty-lathe-660x3000'],
        brand: 'Hoston',
        model: 'C6280/Y-800X3000',
        machineType: 'Large lathe',
        summary:
          'Large lathe for precision turning, threading, drilling, shaping and machining long metal or plastic workpieces, suited to shafts, rollers and industrial components.',
        capacity: 'Workpieces up to 3 m long',
      },
      {
        slug: 'kaka-cq6236kx1000-lathe',
        previousSlugs: ['conventional-lathe'],
        brand: 'KAKA',
        model: 'CQ6236KX1000',
        machineType: 'Small lathe',
        summary:
          'Compact precision lathe for drilling, cutting, shaping and threading metal or plastic workpieces.',
        capacity: 'Up to 1 m long and 200 mm diameter',
      },
      {
        slug: 'hymt-x6232cx16-milling',
        previousSlugs: ['universal-milling-machine'],
        brand: 'HYMT',
        model: 'X6232CX16',
        machineType: 'Milling machine',
        summary:
          'Uses rotary cutters for material removal, gear cutting, form milling, slotting, keyway cutting and sawing on metal and plastic components.',
        capacity: null,
      },
      {
        slug: 'seba-l-550-shaper',
        previousSlugs: ['shaping-machine'],
        brand: 'SEBA',
        model: 'L-550',
        machineType: 'Shaper',
        summary:
          'Removes excess material with a single-point cutting tool, shaping flat surfaces, slots, grooves and contours on metal or plastic.',
        capacity: 'Up to 600 mm stroke',
      },
    ],
    outputs: [
      'Keyway components',
      'Fixturing plates',
      'Mounting blocks',
      'Flanges',
      'Turned shafts',
      'Threaded parts',
      'Fixtures & tooling',
      'Pins & spacers',
      'Custom spare parts',
    ],
  },
  {
    slug: 'press-brake-forming',
    title: 'Press-Brake Forming',
    processType: 'bending-forming',
    summary:
      'Controlled bending for panels, covers, brackets, enclosures, guards, and custom sheet metal profiles.',
    machines: [
      {
        slug: 'vox-vp16032-press-brake',
        previousSlugs: ['vox-qc12y-8x3200-press-brake'],
        brand: 'VOX',
        model: 'VP16032',
        machineType: 'Press brake',
        summary:
          'A heavy-duty hydraulic bending machine that shapes and bends sheet metal or plate with precision. Hydraulic force through steel tooling creates accurate angles, folds and formed components for fabrication work.\n\nSuitable for producing equipment panels, brackets, guards, covers, enclosures, frames and custom metal parts.',
        capacity: null,
      },
    ],
    outputs: [
      'Folded machine panels',
      'Precision bends',
      'Enclosures',
      'L, Z, mounting & custom brackets',
    ],
  },
  {
    slug: 'plate-and-sheet-rolling',
    title: 'Plate & Sheet Rolling',
    processType: 'bending-forming',
    summary:
      'Rolling capacity for cylindrical and conical profiles including tanks, shells, rollers, and curved parts.',
    machines: [
      {
        slug: 'weida-w11-8x3200-rolling',
        previousSlugs: ['plate-rolling-w11-8x3200'],
        brand: 'WEIDA',
        model: 'W11-8X3200',
        machineType: 'Large rolling machine',
        summary:
          'Heavy-duty plate rolling machine for bending metal sheets into cylindrical or conical shapes using motorized rollers.',
        capacity: 'Sheet up to 8 mm',
      },
      {
        slug: 'weida-w11g-rolling',
        previousSlugs: ['manual-sheet-rolling-machine'],
        brand: 'WEIDA',
        model: 'W11G',
        machineType: 'Small rolling machine',
        summary:
          'Compact rolling machine for bending thin metal sheets into cylindrical or conical shapes with precision motorized rollers.',
        capacity: 'Sheet up to 2 mm',
      },
    ],
    outputs: ['Tanks', 'Pressure vessel shells', 'Curved profiles', 'Conveyor rollers'],
  },
  {
    slug: 'radial-and-heavy-drilling',
    title: 'Radial & Heavy Drilling',
    processType: 'machining',
    summary:
      'Heavy workpiece drilling and connection plate preparation for platforms, frames, pipe flanges, and steel structures.',
    machines: [
      {
        slug: 'wdm-z3050x16-1-radial-drill',
        previousSlugs: ['radial-drilling-machine'],
        brand: 'WDM',
        model: 'Z3050X16/1',
        machineType: 'Radial drill',
        summary: 'Drills heavy, fixed workpieces.',
        capacity: 'Up to 50 mm drilling capacity',
      },
    ],
    outputs: [
      'Mounting plates',
      'Pipe flanges',
      'Heavy parts fabrication',
      'Platform connection plates',
      'Frame connection plates',
    ],
  },
  {
    slug: 'hydraulic-pressing',
    title: 'Hydraulic Pressing',
    processType: 'fabrication',
    summary:
      'Pressing and forming operations for stamped panels, reinforcements, formed brackets, and deep drawn components.',
    machines: [
      {
        slug: 'hydraulic-press-j-mdy-100-30',
        brand: null,
        model: 'J MDY 100/30',
        machineType: 'Hydraulic press',
        summary: 'Generates powerful compression force using pressurized hydraulic fluid.',
        capacity: null,
      },
    ],
    outputs: ['Deep drawn components', 'Formed brackets & reinforcements', 'Stamped panels'],
  },
]

/** The seeds as the page renders them, for when the CMS holds nothing yet. */
export const defaultCapabilityProcesses: readonly CapabilityProcess[] = capabilityProcessSeeds.map(
  (seed) => ({
    gallery: [],
    id: seed.slug,
    image: null,
    machines: seed.machines.map(({ previousSlugs: _previous, slug, ...machine }) => ({
      ...machine,
      gallery: [],
      id: slug,
      image: null,
    })),
    outputs: seed.outputs.map((label) => ({ image: null, label })),
    slug: seed.slug,
    summary: seed.summary,
    title: seed.title,
  }),
)
