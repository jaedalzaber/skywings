# Capabilities page images — export list

Source: the "Process Capabilities" slides in Figma
(`2KMN08Gx6UuFqLr3qxFlza`, node-ids `7-701`, `7-647`, `7-549`, `7-597`). The
connected Figma account has no access to that file, so these have to be
exported by hand: select each image in Figma → right panel → **Export** → PNG
(2x, or whatever the source resolution is) → Export.

Put the files in one folder using the tree below, then run:

```bash
CAPABILITY_IMAGES_DIR="C:\path\to\folder" pnpm run seed:capability-images:dry-run
CAPABILITY_IMAGES_DIR="C:\path\to\folder" pnpm run seed:capability-images
```

The dry run lists every match and everything still missing before writing
anything. **File extension doesn't matter** (`.png`/`.jpg`/`.jpeg`/`.webp` all
work) and matching is case- and punctuation-insensitive, but the base name has
to be the one below. Covers 7 of the 9 capabilities — Welding & Assembly and
Surface Treatment & Finishing aren't in this set of slides (see
`capabilities-page` memory), so leave those two out.

```
<folder>/
  laser-cutting/
    process.png                              <- the process reference photo (arc/spark shot)
    outputs/
      sheet-metal-blanks.png
      mounting-brackets.png
      structural-connection-plates.png
      cover-plates.png
      ventilation-panels.png
      complex-geometries.png

  shearing/
    process.png
    outputs/
      cut-sheet-blanks.png
      steel-strips-and-flat-bars.png
      fabrication-ready-plate-sets.png

  cnc-and-conventional-machining/
    process.png
    outputs/
      keyway-components.png
      fixturing-plates.png
      mounting-blocks.png
      flanges.png
      turned-shafts.png
      threaded-parts.png
      fixtures-and-tooling.png
      pins-and-spacers.png
      custom-spare-parts.png

  press-brake-forming/
    process.png
    outputs/
      folded-machine-panels.png
      precision-bends.png
      enclosures.png
      l-z-mounting-and-custom-brackets.png    <- "L, Z, mounting & custom brackets"

  plate-and-sheet-rolling/
    process.png
    outputs/
      tanks.png
      pressure-vessel-shells.png
      curved-profiles.png
      conveyor-rollers.png

  radial-and-heavy-drilling/
    process.png
    outputs/
      mounting-plates.png
      pipe-flanges.png
      heavy-parts-fabrication.png
      platform-connection-plates.png
      frame-connection-plates.png

  hydraulic-pressing/
    process.png
    outputs/
      deep-drawn-components.png
      formed-brackets-and-reinforcements.png
      stamped-panels.png

  machines/
    bodor-c-series-laser.png                  <- Laser Cutting's machine
    vox-vp16032-shear.png                     <- Shearing's machine
    weida-amt-860-vmc.png                     <- CNC: "Vertical Machining Center"
    weida-amt-63-cnc-lathe.png                <- CNC: "CNC Lathe"
    conventional-lathe.png                    <- CNC: "Lathe Machine" (either of the two lathe photos)
    heavy-duty-lathe-660x3000.png             <- CNC: "Lathe Machine" (the other one)
    universal-milling-machine.png             <- CNC: "Milling Machine"
    shaping-machine.png                       <- CNC: "Shaper Machine"
    vox-qc12y-8x3200-press-brake.png          <- Press-Brake's machine
    plate-rolling-w11-8x3200.png              <- Plate & Sheet Rolling: "Rolling Machine" (either)
    manual-sheet-rolling-machine.png          <- Plate & Sheet Rolling: "Rolling Machine" (the other)
    radial-drilling-machine.png               <- Radial & Heavy Drilling's machine
    hydraulic-press-j-mdy-100-30.png          <- Hydraulic Pressing's machine
```

**Every file is optional** — anything you don't have yet just gets skipped and
listed at the end of the run, nothing errors or gets overwritten with a
placeholder. Re-run the command any time you add more; already-set images with
the same bytes are left alone.

After running the seed, mirror the new uploads out of Cloudinary so they're
served from `public/` like the rest of the site's media:

```bash
pnpm run mirror:media
```

This list is generated from what's actually in the `capabilities` and
`machines` collections right now (2026-09-10) — if a capability, machine, or
output label changes, re-check against the admin rather than assuming this
file is still exact.
