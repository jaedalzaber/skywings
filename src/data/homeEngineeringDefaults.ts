/*
 * Client-safe defaults for the home engineering section. Kept apart from
 * '@/data/home' so the component can value-import them without pulling the
 * Payload client into the browser bundle -- the same split the machining,
 * locations and process sections use.
 */
export type HomeEngineeringImage = {
  alt: string
  url: string
}

export type HomeEngineeringDiscipline = {
  /** Stable key, also used to build the heading ids. */
  id: string
  /** Mono line set above the discipline title. */
  eyebrow: string
  /** Short list under `listLead`, one item per line. */
  items: string[]
  listLead: string
  /** Optional copy above the list; CAM carries none in the design. */
  paragraphs?: string[]
  title: string
}

/*
 * Photography for this section is not shot yet: this points at a service still
 * already in the repo so the composition reads as intended, and SafeImg drops
 * to its grey placeholder for anything missing. Swap the url when the design
 * station photograph lands -- nothing else in the section needs to change.
 */
export const defaultEngineeringImage: HomeEngineeringImage = {
  alt: 'Engineer working through a component at the CAD station',
  url: '/images/home/service-02.png',
}

export const defaultHomeEngineeringIntro = {
  /** Section number, set against the heading like the rest of the home page. */
  code: '5.0',
  heading: 'Engineering',
}

/*
 * Software names are placeholders written the way the design lists them, to be
 * confirmed against the engineering team's licences before launch.
 */
export const defaultHomeEngineeringDisciplines: readonly HomeEngineeringDiscipline[] = [
  {
    id: 'cad',
    eyebrow: 'The basis for successful engineering',
    items: ['3D CAD software PTC Creo 9', 'SolidWorks', 'AutoCAD Mechanical'],
    listLead: 'We use the following CAD systems:',
    paragraphs: [
      'We work with state-of-the-art computer technology and the latest CAD/CAM systems.',
    ],
    title: 'CAD',
  },
  {
    id: 'cam',
    eyebrow: 'Time-efficient and intelligent scheduling',
    items: ['NC CAM', 'Radan sheet metal CAM'],
    listLead: 'Processing with:',
    title: 'CAM',
  },
]

export const defaultHomeEngineeringNote = {
  items: [
    'Weld sequence and fixturing',
    'Heat input and distortion',
    'Load paths',
    'Tolerances',
    'Deformations',
  ],
  listLead: 'Each component is checked for',
  paragraphs: [
    'Calculation of forming and weld distortion — simulation for optimal designs. The whole fabrication sequence is simulated, from cutting and bending through welding and assembly to behaviour under load.',
  ],
}
