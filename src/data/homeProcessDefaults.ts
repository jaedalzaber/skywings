/*
 * Fallback copy for the manufacturing process section.
 *
 * Lives apart from home.ts on purpose: HomeProcessSection is a client
 * component and needs these values in the browser, while home.ts imports the
 * Payload client and Next's cache API. Importing a value (rather than a type)
 * from home.ts into a client component drags that whole server layer into the
 * client bundle, which Turbopack refuses with a "revalidateTag ... Pages
 * Router" error. Keep this file free of server imports.
 */

export type HomeProcessStepDefault = {
  description: string
  label: string
  title: string
}

/*
 * By position: a CMS step whose label or description is empty takes the
 * matching entry here, so an expanded panel is never blank.
 */
export const defaultHomeProcessSteps: readonly HomeProcessStepDefault[] = [
  {
    label: 'Brief',
    title: 'Client Brief',
    description:
      'We define the requirement, application, constraints and delivery target before production begins.',
  },
  {
    label: 'Design',
    title: 'Mechanical CAD Design',
    description:
      'Our engineers translate the brief into accurate, production-ready drawings and assemblies.',
  },
  {
    label: 'Machining',
    title: 'Laser Cutting & Machining',
    description:
      'Components are cut and machined to controlled tolerances using the appropriate production process.',
  },
  {
    label: 'Assembly',
    title: 'Welding & Assembly',
    description:
      'Components are aligned, welded and assembled into the required equipment or structure.',
  },
  {
    label: 'Finishing',
    title: 'Surface Treatment & Finishing',
    description:
      'Protective coatings and final finishes are applied for durability and operating conditions.',
  },
  {
    label: 'Delivery',
    title: 'Final Inspection & Delivery',
    description: 'Completed equipment is inspected, documented and prepared for delivery.',
  },
]

/** Two-tone copy: muted by default, `emphasis` runs brought forward in white. */
export type HomeProcessSegment = { emphasis?: boolean | null; text: string }

export const defaultHomeProcessIntro: readonly HomeProcessSegment[] = [
  { text: 'Six controlled stages, ' },
  { emphasis: true, text: 'one accountable team' },
  { text: ' — design, fabrication, finishing and inspection all under our own roof.' },
]

export const defaultHomeProcessSummary: readonly HomeProcessSegment[] = [
  { text: 'Every job runs the same route. The requirement is agreed before anything is cut, ' },
  { emphasis: true, text: 'drawings are approved before production' },
  { text: ', and tolerances are held through machining, welding and assembly. Coatings are chosen for the operating environment, and each unit is ' },
  { emphasis: true, text: 'inspected and documented before dispatch' },
  { text: ' — so what arrives on site is what was specified.' },
]

export const defaultHomeProcessCta = {
  copy: 'For requirements outside our standard product range, Sky Wings develops purpose-built equipment and fabricated products from specification and engineering through manufacturing and final assembly.',
  ctaHref: '/contact',
  ctaLabel: 'Custom Product Service',
  heading: 'Custom Product Development',
  label: 'Custom engineering',
}
