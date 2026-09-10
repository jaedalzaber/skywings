import type { ArticleCategory } from './articleCategories'

/*
 * The knowledge hub's first articles, written for Sky Wings. The seed
 * (`pnpm seed:articles`) writes them into the Articles collection, where they
 * are edited like any other; this file is only their starting point.
 *
 * Bodies use the small Markdown dialect in lib/articles/markdown. Pictures are
 * named by key -- `{{laserMachine}}` -- and the seed swaps each for the media
 * library item named in ARTICLE_MEDIA, so the text never carries an id that
 * differs between databases.
 */

/** Media library files the articles use, by the key the bodies refer to. */
export const ARTICLE_MEDIA = {
  cncProcess: 'Rectangle 243-1.png',
  foldingStandHero: 'folding-stand-hero.png',
  foldingStandScene: 'folding_stand_7-3.png',
  hydraulicProcess: 'Group 31-1.png',
  laserMachine: 'Group 277.png',
  laserProcess: 'Rectangle 243.png',
  plateRollMachine: 'ChatGPT Image Jun 14, 2026, 08_13_03 PM 2.png',
  pressBrakeMachine: 'ChatGPT Image Jun 14, 2026, 07_29_09 PM 2 1.png',
  pressBrakeProcess: 'Group 35.png',
  rollingProcess: 'Group 31.png',
  shearMachine: 'Group 278.png',
  shearProcess: 'Rectangle 258.png',
} as const

export type ArticleMediaKey = keyof typeof ARTICLE_MEDIA

export type ArticleSeed = {
  body: string
  category: ArticleCategory
  excerpt: string
  featured?: boolean
  image: ArticleMediaKey
  publishedAt: string
  slug: string
  title: string
}

export const articleSeeds: readonly ArticleSeed[] = [
  {
    slug: 'sheet-metal-prototype-fabrication',
    title: 'Sheet metal prototype fabrication: process, materials and design rules',
    category: 'guides',
    featured: true,
    publishedAt: '2026-09-08T08:00:00.000Z',
    image: 'hydraulicProcess',
    excerpt:
      'How a sheet metal prototype goes from a CAD model to a finished part — the processes involved, the materials that behave, and the design rules that keep a prototype on the same route as production.',
    body: `
## Key takeaways

- A sheet metal prototype is made on the same machines as the production part — laser, press brake, welding — so it tests fit, function and manufacturability in one go.
- Most prototype delays start on the drawing, not on the machines: missing bend radii, holes too close to bends and tolerances tighter than the part needs.
- Prototype in the material you intend to produce in. Switching grades later changes how the part bends, springs back and welds.
- Send a 3D model and a drawing with the critical dimensions marked. General tolerances can cover everything else.

## What sheet metal prototyping is

A sheet metal prototype is a part cut from flat stock, formed, joined and finished to the design intent — usually one to a few dozen pieces, made to prove the design before committing to volume. Unlike a printed prototype, it is made from the real material by the real process, so what you learn from it carries straight over to production: whether the flanges clear, whether the weldment distorts, whether the bracket takes the load.

Because there is no dedicated tooling involved — no stamping dies, no moulds — a design change is a change to a file. That is what makes sheet metal so well suited to iteration: revision B can be on the laser the day revision A comes back marked up.

## When to prototype in sheet metal

### You need to test in the real material

Load, vibration, fatigue and fit against mating parts only mean something in the final material and thickness. A printed or machined stand-in answers a different question.

### The design is still moving

Early in a programme, expect two or three revisions. Laser cutting and press braking have almost no set-up cost, so each revision costs little more than the material and the machine time.

### Volumes are not yet known

The same route serves ten parts or a few hundred. When volumes are large enough to justify it, individual features can move to punching, stamping or dedicated fixtures — without changing the part.

### An assembly needs checking

Brackets, enclosures and frames that bolt or weld to other parts are where surprises hide: hole alignment, fastener access, room for a weld torch. A physical prototype finds them in an afternoon.

## The process, step by step

1. **Engineering review.** The model and drawing are checked for manufacturability: bend reliefs, minimum flange lengths, hole-to-edge distances, and whether the tolerances match what the processes can hold.
2. **Flat pattern.** The 3D model is unfolded using bend allowances for the actual material, thickness and tooling, so the formed part lands on its dimensions.
3. **Cutting.** A fiber laser cuts profiles, holes and slots; a guillotine shear makes straight blanks quickly.
4. **Forming.** A CNC press brake makes the bends in sequence; plate rolls produce cylinders and arcs.
5. **Joining.** MIG or TIG welding, riveting, or pressed-in hardware such as captive nuts and studs.
6. **Finishing.** Deburring, then powder coating, painting, galvanising or a brushed finish, as specified.
7. **Inspection.** A first-article check of the critical dimensions against the drawing before the batch is released.

![Fiber laser cutting machine]({{laserMachine}})

## Materials that work well for prototypes

- **Mild steel** (S235, S275, or DC01 cold-rolled sheet). Inexpensive, forms easily and welds well. It needs a coating for outdoor use.
- **Stainless steel** (304, or 316 for coastal and chemical environments). Corrosion-resistant without a coating, but harder on tooling and it springs back more after bending.
- **Aluminium** (5052, 5754, 6061). Light and naturally corrosion-resistant. The 5000-series alloys bend well; 6061 in the T6 temper cracks on tight bends, so give it a generous radius.
- **Galvanised steel.** Coated before cutting, so edges and welds need touching up — worth it for enclosures that live outdoors.

## Design rules that save a revision

- **Inside bend radius.** Design to at least the material thickness. For most steels, standard press brake tooling produces a radius close to that anyway.
- **Minimum flange length.** A flange has to be long enough to sit across the die while it bends. About four times the thickness is a safe starting point; ask if you need shorter.
- **Holes near bends.** Keep holes at least two and a half times the thickness, plus the bend radius, away from a bend line, or they stretch into ovals.
- **Hole size.** Laser-cut holes should be at least the material thickness in diameter. Smaller holes are better drilled or reamed afterwards.
- **Bend reliefs.** Where a bend runs into an edge, add a small relief slot — about the thickness wide — so the corner does not tear.
- **One radius throughout.** Using the same inside radius on every bend means one tool set-up instead of several.
- **Tolerances.** Call out only the dimensions that matter. A general tolerance such as ISO 2768-m covers the rest and keeps the cost down.

## What to send with a request

- A 3D model (STEP) and a 2D drawing (PDF), with material, thickness, finish and quantity.
- The critical dimensions and their tolerances, marked on the drawing.
- The expected production volume, even as a range — it changes how the part is best made.

Our guide to [writing a fabrication RFQ](/resources/how-to-write-a-fabrication-rfq) goes through the full list.

## How we approach prototypes

We cut, form, weld and finish in our own workshops in Sharjah and Fujairah, so a prototype does not travel between suppliers between operations. Drawings are reviewed before anything is cut, and where a small change would make the part easier to produce in volume, we say so alongside the quote — you decide whether to take it.
`,
  },
  {
    slug: 'fiber-laser-cutting-design-guide',
    title: 'Designing parts for fiber laser cutting',
    category: 'design',
    publishedAt: '2026-09-02T08:00:00.000Z',
    image: 'laserProcess',
    excerpt:
      'Hole sizes, kerf, tabs, heat and edge quality — what a fiber laser can and cannot do, and how to draw a part so it cuts right the first time.',
    body: `
## Key takeaways

- Fiber lasers cut sheet and plate accurately — on thin sheet, tolerances around ±0.1 mm are routine — with accuracy loosening as the material gets thicker.
- Keep holes at least as large as the material thickness, and webs between features at least one thickness wide.
- Draw the part at its nominal size. The machine compensates for the width of the cut; the drawing should not.
- Say which edges matter. Thick plate shows fine striations and a slight taper; if an edge is visible or mates with another part, note it.

## How fiber laser cutting works

A fiber laser focuses a high-power infrared beam onto the sheet through a cutting head. The beam melts a narrow channel through the metal while an assist gas blows the molten material out from underneath. The choice of gas shapes the edge:

- **Nitrogen** shields the cut from oxygen and leaves a bright, oxide-free edge — the usual choice for stainless steel and aluminium, and for mild steel that will be painted or welded.
- **Oxygen** reacts with mild steel and adds heat to the cut, which makes thick plate faster to cut but leaves a thin oxide layer on the edge.

Compared with older CO2 lasers, fiber lasers are markedly faster on thin and medium sheet and cope far better with reflective metals such as aluminium, brass and copper.

![Fiber laser cutting machine]({{laserMachine}})

## Thickness and tolerance

Cutting capacity rises with the power of the laser source, but the useful limit is usually edge quality rather than whether the beam gets through. As plate gets thicker the cut slows, the kerf widens and the edge develops a slight taper and visible striations.

As a guide, positional accuracy of around ±0.1 mm is normal on sheet a few millimetres thick. On plate over roughly 10 mm, allow more, and expect the bottom of the edge to differ slightly from the top. If a thick-plate edge has to be square and smooth — a machined fit, for example — plan for machining it after cutting.

## Design rules

### Holes and slots

- Make holes at least as large in diameter as the material is thick. Below that the pierce is less clean and the hole less round; small precise holes are better drilled or reamed.
- Keep holes at least one material thickness from any edge, and further on thin sheet, where a narrow bridge of material can distort from the heat.
- Slots for tabs and fixtures should be drawn at the fit you need, not the nominal tab width — tell us the mating part and we will size them.

### Webs, tabs and fine detail

- Webs and bridges narrower than the material thickness can warp from the heat and may not survive cutting.
- Very small parts can drop between the support slats of the machine bed. Micro-joints — tiny uncut tabs — hold them in the sheet until they are knocked out, leaving a small witness mark. If a witness mark is not acceptable on an edge, mark that edge on the drawing.

### Corners and marking

- Sharp internal corners are no problem for a laser, unlike milling. Adding a small radius still helps where the corner carries load, because it spreads the stress.
- Part numbers and alignment marks can be etched at low power in the same operation, which saves a separate marking step.

### Heat and flatness

The heat-affected zone of a laser cut is narrow, but a dense pattern — a ventilation grille or a perforated panel — puts a lot of heat into a small area of thin sheet and can bow it. Spread dense patterns out where you can, or allow for flattening afterwards.

## Edges and what to put on the drawing

- **Burrs.** Nitrogen-cut edges are nearly burr-free; if edges will be handled, ask for deburring anyway.
- **Oxide.** Oxygen-cut mild steel carries an oxide layer that can weaken powder coat adhesion on the edges. If the part is to be powder coated, specify nitrogen cutting or edge preparation.
- **Grain.** Brushed stainless and pre-finished sheet have a direction. Show it on the drawing if it matters for appearance.

## Files that cut cleanly

- A DXF or DWG at 1:1 scale, in millimetres, with closed contours and no duplicated lines — or simply the 3D model, which we will unfold.
- Text that should be cut (not etched) converted to geometry.
- Material, thickness, quantity and finish in the title block or with the request.

## After the laser

Most laser-cut blanks go on to be bent, welded or coated. Draw the flat part with the next operation in mind: bend reliefs, weld preparation, and hanging holes for coating are all free to add at the cutting stage. Our [press brake design guide](/resources/press-brake-forming-design-guide) covers the bending side.
`,
  },
  {
    slug: 'press-brake-forming-design-guide',
    title: 'Press brake forming: bend radius, flange length and springback',
    category: 'design',
    publishedAt: '2026-08-27T08:00:00.000Z',
    image: 'pressBrakeProcess',
    excerpt:
      'Inside radius, minimum flange, K-factor and springback — the numbers behind a bent part, and the drawing habits that keep bends on dimension.',
    body: `
## Key takeaways

- The die opening sets both the inside radius you get and the shortest flange you can bend. Design to the tooling, not to an arbitrary radius.
- One material thickness is a safe default inside radius for mild steel. Allow more for stainless, high-strength steel and hard aluminium alloys.
- Flat patterns depend on the K-factor, which varies with material and tooling. Let the fabricator unfold the part for its own tools.
- Keep holes and cut-outs clear of bend lines, and add reliefs where bends meet edges.

## How air bending works

Most CNC press brake work is air bending. The punch pushes the sheet into a V-shaped die without forcing it to the bottom, and the bend angle is set by how far the punch travels. Because the sheet only touches the punch tip and the two shoulders of the die, one set of tools can make a wide range of angles, and the CNC back gauge positions each bend in turn.

In air bending, the inside radius is set mainly by the width of the die opening, not by the punch. For mild steel it comes out at roughly 15 to 16 per cent of the die width. Dies are usually chosen at six to eight times the material thickness for thin sheet — which is why the resulting inside radius lands close to one thickness.

![CNC press brake]({{pressBrakeMachine}})

## Minimum flange length

A flange has to span the die opening while it is being bent. Too short, and it drops into the V and the bend goes wrong. A practical minimum is a little over half the die width, which works out at around four to six times the material thickness with common tooling.

If a design needs a shorter flange, there are options — a narrower die with a tighter radius, or bending it longer and trimming — but they are decisions to make before the drawing is released, not after.

## Bend allowance, K-factor and flat patterns

When sheet bends, the outside stretches and the inside compresses. Somewhere in between is a neutral axis that keeps its length, and the K-factor describes where it sits: the distance from the inside surface to the neutral axis, divided by the thickness. In air bending it is typically between about 0.33 and 0.5.

The length of material consumed by a bend — the bend allowance — follows from it:

> Bend allowance = bend angle (in radians) × (inside radius + K-factor × thickness)

Because the K-factor depends on the material, the tooling and the radius, a CAD system's default rarely matches a particular machine exactly. We calculate flat patterns from our own tooling data, so send the 3D model and dimension the drawing to the features that matter — usually the outside of the flanges — rather than to a flat pattern made with someone else's numbers.

## Springback

Metal relaxes a little when the punch lifts. Mild steel springs back by a degree or two; stainless steel, high-strength steel and aluminium alloys more. A CNC press brake compensates by over-bending, and the first parts of a batch are measured and corrected before the rest are run.

A tolerance of ±1° on bend angles is a comfortable default. Tighter is possible, but say where it is actually needed.

## Design rules

- **Holes near bends.** Keep holes at least two and a half times the thickness, plus the bend radius, from a bend line. Closer than that and they deform.
- **Bend reliefs.** Where a bend meets an edge, cut a relief at least as wide as the material thickness and slightly deeper than the bend, or the corner tears.
- **One radius.** A single inside radius across the part means a single tool set-up.
- **Grain direction.** Bending across the rolling direction of the sheet reduces the risk of cracking — most important for aluminium alloys and high-strength steels.
- **Clearance.** Deep channels and closed boxes have to clear the punch and the machine's upper beam on the last bend. A channel much deeper than it is wide may need special tooling or a split design.
- **Hems.** A hem folds the edge back flat on itself to make it safe to handle or to stiffen it. It works on thin sheet and needs flattening tooling, so mention it early.

## Tolerances across several bends

Every bend adds its own small variation, so a dimension measured across three bends carries the tolerance of all three. Dimension critical features from a single datum, and put tight tolerances only where parts actually mate.

## Our press brake cell

Our CNC press brake handles parts up to 3.2 metres long. If you are unsure whether a part can be bent as drawn, send the model — checking it before release is quicker than finding out at the machine.
`,
  },
  {
    slug: 'shearing-vs-laser-cutting',
    title: 'Shearing or laser cutting? Choosing the right cut for sheet and plate',
    category: 'techniques',
    publishedAt: '2026-08-20T08:00:00.000Z',
    image: 'shearProcess',
    excerpt:
      'A guillotine shear and a fiber laser both turn sheet into blanks, but they are good at different things. How to tell which one a part needs — and when to use both.',
    body: `
## Key takeaways

- A shear makes straight cuts across a sheet in a single stroke — the fastest and cheapest way to produce rectangular blanks and strips.
- A laser cuts any profile, with holes and slots, and holds tighter tolerances, but costs more per metre on simple straight work.
- The edges differ: a sheared edge has a rounded side, a smooth band and a torn band; a laser edge is uniform but has been heated.
- Many parts use both — sheared blanks with laser-cut features, or laser profiles alongside sheared strips.

## How a guillotine shear works

A hydraulic guillotine shear clamps the sheet with a row of hold-downs and drives an upper blade down past a fixed lower blade. The upper blade is set at a slight rake angle, so it cuts progressively along the line rather than all at once, which reduces the force needed. A back gauge sets the length of each cut.

The gap between the blades is adjusted to the material and its thickness. Set correctly, the cut is clean; too tight or too loose and the edge tears or burrs.

![Hydraulic guillotine shear]({{shearMachine}})

## Where shearing wins

- **Rectangular blanks** for bending, rolling or welding.
- **Strips** cut from sheet.
- **Speed.** One stroke per cut, with no heat put into the part.
- **Cost.** For straight cuts the shear is hard to beat, particularly in quantity.

## Where the laser wins

- **Any shape** — curves, internal cut-outs, holes, slots and tabs.
- **Nesting.** Many different parts can be arranged on one sheet to cut waste.
- **Accuracy.** Tighter tolerances on position and squareness.
- **Small parts** that a shear could not hold.

## The edges compared

A **sheared edge** has three zones: a slightly rounded roll-over on the side the blade entered, a smooth burnished band where the blade cut, and a rougher fracture band where the metal broke away — usually with a small burr on the underside. Narrow strips can bow and twist as the blade releases stresses in the sheet.

A **laser edge** is uniform and square on thin sheet, with fine striations on thicker plate, and a narrow heat-affected zone. On oxygen-cut mild steel there is a thin oxide layer to consider before painting or powder coating.

Neither edge is better in general. A sheared edge is perfectly good for a blank that is about to be bent and welded; a visible or mating edge often deserves the laser.

## A simple rule

1. Only straight edges and no internal features — shear it.
2. Holes, slots, curves or tabs — laser it.
3. A large rectangular blank with a few holes — shear the blank and drill the holes, or laser the whole part if the holes must be accurately placed relative to the edges.

## How we route it

We run a hydraulic guillotine shear alongside the fiber laser, so each blank goes to whichever machine suits it. You do not need to choose on the drawing: tell us what each edge has to do, and we will pick the route — and the price will reflect it.
`,
  },
  {
    slug: 'plate-and-sheet-rolling-guide',
    title: 'Plate and sheet rolling: diameters, flat ends and tolerances',
    category: 'techniques',
    publishedAt: '2026-08-13T08:00:00.000Z',
    image: 'rollingProcess',
    excerpt:
      'Cylinders, cones and arcs from flat plate — how plate rolls work, why the ends stay flat unless you plan for them, and what to specify on the drawing.',
    body: `
## Key takeaways

- Rolling bends plate into cylinders, part-cylinders and cones by passing it back and forth between rolls, a little more each pass.
- The tightest diameter you can roll depends on the machine's top roll and the thickness of the plate. Ask before designing small cylinders in thick plate.
- A three-roll machine leaves a flat at each end of the plate unless the ends are pre-bent. Say whether the seam must be round.
- Specify inside, outside or mean diameter — and whether the seam is welded, and by whom.

## How plate rolling works

A symmetrical three-roll machine has two lower rolls and an upper roll between them. The plate is fed across the lower rolls and the upper roll is lowered onto it, bending the plate over the lower pair. Driving the rolls forward and back, and lowering the top roll a little each time, increases the curvature pass by pass until the plate reaches the required radius.

Rolling gradually like this spreads the deformation evenly, which is why a rolled cylinder is smooth rather than faceted.

![Three-roll plate rolling machine]({{plateRollMachine}})

## Flat ends and pre-bending

On a symmetrical three-roll machine, the part of the plate that never passes between all three rolls cannot be bent. That leaves a flat at the leading and trailing edge — roughly half the distance between the lower rolls. When the cylinder is closed, the two flats meet at the seam as a slight peak.

If the seam has to be round, the ends are pre-bent first, typically on the press brake, before the plate goes into the rolls. It is an extra operation, so mention it if you need it.

## How small can it go?

The smallest diameter a machine can roll is limited by its top roll, since the plate has to wrap around it. A common rule of thumb puts the minimum inside diameter at roughly 1.2 to 1.5 times the top roll diameter for plate at the machine's rated thickness; thinner material can go a little tighter. For a small cylinder in thick plate, it is worth checking before the design is fixed.

## Cones

Cones are rolled from a flat, fan-shaped blank. The small end has to travel more slowly through the rolls than the large end, which takes skill and, on many machines, a cone attachment. Cones are generally less accurate than cylinders, so give them a slightly more generous tolerance.

## What to put on the drawing

- **Diameter.** State whether it is the inside, outside or mean diameter — on thick plate the difference is significant.
- **Roundness.** For parts that fit into or over something else, roundness usually matters more than the exact diameter. A welded cylinder can be re-rolled after welding to bring it true.
- **Seam.** Whether the seam is welded, the weld preparation, and whether the peak at the seam must be removed.
- **Length.** The width of plate the machine can take sets the longest cylinder that can be rolled in one piece.

## Materials

Mild steel rolls easily and predictably. Stainless steel springs back more and needs more passes. Aluminium marks easily, so protective film or clean rolls are worth asking for on visible parts. Hot-rolled plate carries mill scale, which comes off during rolling and should be cleaned before coating.

## Our rolling capacity

Our three-roll plate rolling machine takes plate up to 3.2 metres wide, and a separate sheet roller handles thin material. Send the diameter, thickness and length, and we will confirm how it rolls.
`,
  },
  {
    slug: 'materials-for-ground-support-equipment',
    title: 'Mild steel, aluminium or stainless? Choosing materials for ground support equipment',
    category: 'materials',
    publishedAt: '2026-08-06T08:00:00.000Z',
    image: 'foldingStandScene',
    excerpt:
      'Ramp equipment lives outdoors, gets knocked, and often has to be light enough to push by hand. How the three common materials compare for stands, stairs, dollies and platforms.',
    body: `
## Key takeaways

- Coated mild steel is the default for heavy frames: strong, stiff, inexpensive, and easy to weld and repair anywhere.
- Aluminium is about a third the density of steel. For equipment moved by hand — stands, ladders, light platforms — the weight saving is worth its higher cost.
- Stainless steel earns its place where coatings cannot survive or hygiene matters: catering equipment, fluid handling and the most exposed coastal sites.
- The coating matters as much as the metal. In Gulf heat, sun and salt, specify the coating system, not just "painted".

## What the apron asks of a material

Ground support equipment works outdoors, often in direct sun, in sand and dust, and — at coastal airports — in salt-laden air. It is splashed with fuel and hydraulic fluid, knocked by vehicles and loaded unevenly. It has to be repairable by a local workshop, and much of it is moved by people rather than tugs. Every material choice trades these demands against each other.

## Mild steel

Steel is strong and stiff, costs the least, and can be welded and repaired almost anywhere. For towed and heavily loaded equipment — dollies, racks, tow bars, heavy maintenance stands — it is usually the right answer.

Its weakness is corrosion. Uncoated steel will not last on the apron, so the coating system is part of the design:

- **Hot-dip galvanising** (to ISO 1461) coats the whole part, inside and out, in zinc. It is tough and self-healing at small scratches, but it has to be designed for — vent and drain holes for hollow sections, and no sealed cavities.
- **Powder coating** gives a hard, even, coloured finish. A UV-resistant polyester powder holds its colour in strong sun much better than a standard one.
- **Duplex systems** — galvanised and then powder coated — give the longest life, and are worth considering for equipment kept outdoors for many years.

## Aluminium

Aluminium is about a third the density of steel. It is also only about a third as stiff, so an aluminium frame needs deeper sections to deflect as little as a steel one; allowing for that, an aluminium structure typically weighs around half its steel equivalent. For anything a technician pushes, lifts or folds, that difference is what matters.

Aluminium resists corrosion without a coating, though a coating still helps in marine air. Two design points need care:

- **Welding weakens heat-treated alloys.** A 6061-T6 or 6082-T6 frame loses a substantial part of its strength in the zone next to a weld. Keep welds away from the most highly stressed areas, or design for the reduced strength.
- **Mixed metals corrode.** Where aluminium meets steel — an aluminium platform on a steel chassis, for example — isolate the two with non-conductive washers or pads, or the aluminium corrodes at the joint.

![Folding maintenance stand]({{foldingStandHero}})

## Stainless steel

Stainless steel needs no coating and is easy to keep clean, which is why it dominates catering and galley equipment. Grade 304 suits general use; 316, with added molybdenum, resists chlorides better and is the choice near the sea or where cleaning chemicals are strong.

It costs more, weighs as much as mild steel and is harder to form. Two details make the difference between stainless that stays bright and stainless that stains:

- **Surface finish.** A smooth, brushed or polished finish sheds contaminants; a rough one holds them and shows brown "tea staining" in coastal air.
- **Weld treatment.** Welding discolours the surface and reduces its corrosion resistance locally. Welds should be cleaned and pickled or passivated afterwards.

## Choosing in practice

1. Moved by one person — start with aluminium.
2. Towed, or heavily loaded — galvanised or duplex-coated steel.
3. In contact with food, water or harsh chemicals — stainless steel.
4. Mixed — an aluminium superstructure on a steel chassis is common; just isolate the joint.

## Getting it right the first time

When you send a requirement for ground support equipment, tell us how it is moved, where it is stored, and what it carries. Those three answers usually settle the material — and the coating — before anything else is decided.
`,
  },
  {
    slug: 'how-to-write-a-fabrication-rfq',
    title: 'How to write an RFQ that gets an accurate fabrication quote',
    category: 'guides',
    publishedAt: '2026-07-30T08:00:00.000Z',
    image: 'cncProcess',
    excerpt:
      'The ten things a fabricator needs to price a part properly — and the gaps that turn a quick quote into a week of emails.',
    body: `
## Key takeaways

- A complete request covers geometry, material, quantity, finish and tolerances. Leave any of them out and the quote rests on assumptions — or waits on questions.
- Send both a 3D model and a 2D drawing: the model carries the geometry, the drawing carries the intent.
- Give the expected annual volume as well as the first order. It changes how the part is best made, and what it costs.
- Mark the dimensions that matter and say what the part does. General tolerances can cover the rest.

## Why requests stall

Most quotes are not slow because pricing is hard. They are slow because something is missing — the material grade, the finish, which of two conflicting dimensions is right — and every question costs a day. A complete request up front is the fastest route to an accurate price, and to a quote you can compare fairly with others.

## What to include

1. **A 3D model.** STEP is the safest format; most CAD systems export it, and it opens anywhere.
2. **A 2D drawing.** A PDF with a title block, a revision letter, tolerances, finish callouts and weld symbols. If the model and drawing disagree, say which one wins.
3. **Material and thickness.** The grade and standard — S275JR steel, 304 stainless with a 2B finish, 5754 aluminium — and whether an equivalent is acceptable.
4. **Quantity.** The prototype quantity, the first batch, and the expected annual volume.
5. **Finish.** The coating type, colour (a RAL number, for example), thickness, and any areas to be masked.
6. **Tolerances.** The general tolerance standard — such as ISO 2768-m — and specific tolerances on the features that matter.
7. **Welding requirements.** The process, the standard it must meet, and the inspection expected.
8. **Hardware and assembly.** Inserts, fasteners, sub-assemblies, labelling and kitting.
9. **Inspection and documents.** Whether you need a first-article report, material certificates (for example EN 10204 type 3.1) or a certificate of conformity.
10. **Delivery.** The date you need it, where it goes, the Incoterm, and any packaging requirements.

## The gaps we see most often

- **Tight tolerances everywhere.** A ±0.05 mm tolerance applied across a laser-cut bracket forces slower processes and extra inspection on features that do not need them. Tight tolerances belong on the features that locate or mate.
- **"Painted", with no specification.** Paint systems vary widely in cost and life. Give the coating type, colour and where the part will be used.
- **Missing revision control.** Two versions of the same drawing in one conversation is how the wrong part gets made. Put a revision letter on every file.
- **No volume.** Ten parts and ten thousand parts are made in different ways. Even a rough annual figure helps.

## Confidential designs

If a design is confidential, ask for a non-disclosure agreement before you send the files. Any fabricator used to industrial work will expect the question.

## What happens next

When a request arrives with us, it goes to an engineer before it goes to pricing. We aim to raise any questions together, in one list, rather than one at a time — and where a small change to the design would make the part cheaper or more robust to make, we note it separately so you can take it or leave it.

Ready to send one? [Request a quote](/contact) and attach your files.
`,
  },
]
