/*
 * Client-safe defaults for the home machining capability section. Kept apart
 * from '@/data/home' so the client component can value-import them without
 * pulling the Payload client into the browser bundle -- the same split the
 * locations and process sections use.
 */
export type HomeMachiningImage = {
  alt: string
  url: string
}

export type HomeMachiningGroup = {
  /** Stable key, also used to build the panel's aria ids. */
  id: string
  /** Photographs of the cell, stepped through with the panel arrows. */
  images: HomeMachiningImage[]
  /**
   * Machine names, set one per line in mono. Written as they appear on the
   * shop floor asset list, so repeated models are repeated here on purpose.
   */
  machines: string[]
  title: string
}

export type HomeMachiningStat = {
  label: string
  value: string
}

/*
 * Set beside the heading, in the half of the row the title cell leaves. The
 * machine count is the length of the lists below rounded down, so the two
 * stay honest against each other as the shop list grows.
 */
export const defaultHomeMachiningStats: readonly HomeMachiningStat[] = [
  { label: 'Machines', value: '30+' },
  { label: 'Skilled workers', value: '50+' },
]

export const defaultHomeMachiningIntro = {
  eyebrow: 'Machining capability',
  heading: 'Machining\ncapability',
}

/*
 * Photographs are not shot yet: these point at the service stills already in
 * the repo so the panels read as intended, and SafeImg drops to its grey
 * placeholder for anything missing. Swap the urls as the shop photography
 * lands -- nothing else in the section needs to change.
 */
export const defaultHomeMachiningGroups: readonly HomeMachiningGroup[] = [
  {
    id: 'laser-cutting',
    title: 'Laser cutting',
    machines: [
      'FIBER LASER 6KW — 3000 x 1500',
      'FIBER LASER 4KW — 3000 x 1500',
      'PLASMA CUTTING TABLE',
    ],
    images: [
      { alt: 'Fiber laser cutting sheet steel', url: '/images/home/service-01.png' },
      { alt: 'Cut parts leaving the laser bed', url: '/images/home/machining-laser-02.jpg' },
    ],
  },
  {
    id: 'cnc-machining',
    title: 'CNC machining',
    machines: [
      'VERTICAL MACHINING CENTER VMC-855',
      'VERTICAL MACHINING CENTER VMC-855',
      'VERTICAL MACHINING CENTER VMC-1160',
      'CNC LATHE CK6150',
      'CNC LATHE CK6150',
      'RADIAL DRILLING MACHINE Z3050',
    ],
    images: [
      { alt: 'Machining centre cutting an aluminium part', url: '/images/home/service-02.png' },
      { alt: 'Tool carousel on the machining centre', url: '/images/home/machining-cnc-02.jpg' },
    ],
  },
  {
    id: 'bending-forming',
    title: 'Bending and forming',
    machines: [
      'CNC PRESS BRAKE 160T — 3200',
      'CNC PRESS BRAKE 100T — 3200',
      'HYDRAULIC SHEARING MACHINE QC12K',
      'PLATE ROLLING MACHINE W11-16',
    ],
    images: [{ alt: 'Press brake forming a steel panel', url: '/images/home/service-03.png' }],
  },
  {
    id: 'welding-fabrication',
    title: 'Welding and fabrication',
    machines: [
      'MIG WELDING STATION — 500A',
      'MIG WELDING STATION — 500A',
      'TIG WELDING STATION — 400A',
      'TIG WELDING STATION — 400A',
      'SPOT WELDING MACHINE DN-63',
      'WELDING POSITIONER — 2T',
    ],
    images: [
      { alt: 'Welder working on a fabricated frame', url: '/images/home/service-04.png' },
      { alt: 'Fabricated assembly on the welding jig', url: '/images/home/machining-weld-02.jpg' },
    ],
  },
  {
    id: 'surface-treatment',
    title: 'Surface treatment',
    machines: [
      'SHOT BLASTING CHAMBER',
      'POWDER COATING LINE — CURING OVEN 7M',
      'WET SPRAY BOOTH',
      'HOT-DIP GALVANISING (PARTNER FACILITY)',
    ],
    images: [
      {
        alt: 'Powder coated components leaving the curing oven',
        url: '/images/home/service-05.png',
      },
    ],
  },
  {
    id: 'assembly',
    title: 'Assembly',
    machines: [
      'ASSEMBLY BAY 1 — OVERHEAD CRANE 5T',
      'ASSEMBLY BAY 2 — OVERHEAD CRANE 10T',
      'HYDRAULIC TEST BENCH',
      'TORQUE CONTROLLED FASTENING SET',
    ],
    images: [
      {
        alt: 'Equipment being assembled in the fabrication bay',
        url: '/images/home/machining-assembly-01.jpg',
      },
    ],
  },
  {
    id: 'measurement',
    title: 'Measurement and inspection',
    machines: [
      'COORDINATE MEASURING ARM — 3.0M',
      'HEIGHT GAUGE 600 / DIGITAL',
      'COATING THICKNESS GAUGE',
      'ULTRASONIC WELD TESTING SET',
    ],
    images: [
      {
        alt: 'Inspection of a machined component',
        url: '/images/home/machining-inspection-01.jpg',
      },
    ],
  },
]
