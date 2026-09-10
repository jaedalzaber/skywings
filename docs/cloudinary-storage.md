# Cloudinary storage

Uploads for `media`, `brochures` and `three-d-assets` are stored in Cloudinary
through a project-local adapter in `src/storage/cloudinary/`, wired up in
`src/payload.config.ts`.

This replaced `@payloadcms/storage-vercel-blob`, whose store began returning
`403` on every content read while its metadata API kept working. The adapter
turned that into an empty `204`, so assets silently served nothing.

## Setup

Add to `.env` (values from the Cloudinary dashboard → Settings → API Keys):

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Without them, development warns and falls back to local disk; **production
refuses to boot**. That is deliberate — a storage plugin that disables itself
quietly is what made the previous outage hard to spot.

## Layout

Assets land under `skywings/<collection>/<file>` in the Cloudinary account.

| Collection       | Delivery                                  | Why |
| ---------------- | ----------------------------------------- | --- |
| `media`          | Direct `res.cloudinary.com` CDN URL       | `read` is public, so the proxy adds nothing |
| `brochures`      | Proxied via `/api/brochures/file/`        | Reads gate on `isPublic` |
| `three-d-assets` | Proxied via `/api/three-d-assets/file/`   | Reads gate on `isPublic` |

Resource type is derived from the **file extension**, not the mime type, so
upload, delete and URL generation always resolve the same object. Images and
video drop the extension from the public ID (Cloudinary treats it as the
delivery format); `raw` files — PDFs and 3D models — keep it.

PDFs are stored as `raw` rather than `image` so Cloudinary's default
PDF-delivery restriction does not apply.

## Plan limits

The account is on Cloudinary's free plan: roughly 10 MB per image/raw upload and
100 MB per video. Uploads over the cap are rejected **before** the API call with
a message naming the file and the limit, rather than failing opaquely.

Uncompressed GLB exports blow past this immediately. Compress first:

```bash
pnpm run compress:glb
```

That runs `gltf-transform optimize` (Draco geometry + WebP textures) over
`three-d-assets/`, writing `*.compressed.glb` alongside the originals. On
`Folding Stand.glb` it produced a 98% reduction — 36.2 MB to 862 KB. Pass
`--replace` to overwrite the originals in place once you are happy with the
result; the sync script skips `.compressed.glb` artifacts so they never upload
as stray duplicates.

If a paid plan raises the caps, override them per resource type:

```ts
cloudinaryStorage({
  collections: { ... },
  maxBytes: { raw: 100 * 1024 * 1024 },
  rootFolder: 'skywings',
})
```

## Local delivery (saving credits)

The free plan also meters **delivery bandwidth** against a monthly credit quota,
and in September 2026 the account got close to it. Since then, files the
deployment already carries are served from it by default. Uploads still go to
Cloudinary.

- **Media** is copied into `public/media/` and handed out as `/media/<file>`.
  If a file is identical to one already in `public/` (like `public/images/` or
  the hero video in `public/videos/`), the URL points at that copy instead.
- **Brochures and 3D assets** are read from the committed `brochures/` and
  `three-d-assets/` folders by the file route, so `isPublic` is still enforced.
  `outputFileTracingIncludes` in `next.config.ts` bundles those folders for it.
- The default hero video is `public/videos/skywings-intro.mp4`. It has the same
  bytes as the Cloudinary original.

What counts as local is recorded in `src/storage/local-delivery-manifest.json`,
which is written by:

```bash
pnpm run mirror:media:dry-run
pnpm run mirror:media
```

The script checks each local file against the Cloudinary object's byte size and
downloads only what is missing or stale. **Re-run it and commit after uploading
or replacing files.** Until then, those files are served from Cloudinary as
before, so nothing breaks in the meantime.

Every `cachedQuery` key includes a fingerprint of the manifest, so cached pages
pick up new URLs without a manual cache purge.

To serve everything from Cloudinary again, set `MEDIA_DELIVERY=cloudinary`.

## Uploading local files

```bash
pnpm run sync:cloudinary:dry-run   # show what would upload
pnpm run sync:cloudinary           # upload media/, brochures/, three-d-assets/
```

Safe to re-run — uploads overwrite in place, so it can be used repeatedly as
more originals are restored.

Note that `sync:cloudinary` only pushes **bytes**. It does not create Payload
documents, so anything uploaded that way is invisible in the admin unless a
document already references that filename.

## Importing files as Media documents

To make a local file selectable in the admin, it has to go through Payload so
that a document and a Cloudinary object are created together:

```bash
pnpm run import:images:dry-run
pnpm run import:images
```

This imports `public/images/**`. It is idempotent — filenames already present
in Media are skipped, so Payload never appends a `-1` dedup suffix on a re-run.

The originals stay in `public/images`: they are the hardcoded `??` fallbacks in
`HomeBlocks.tsx` and `data/home.ts` and must keep working without a network
round trip. Do not repoint those constants at Cloudinary.

> `payload run` strips every argument after the script path, so these scripts
> take `DRY_RUN=1` rather than a `--dry-run` flag.

## Auditing dangling media

```bash
pnpm run audit:media
```

Fetches every Media document's URL, reports the ones that no longer resolve,
and lists which documents still reference them — plus which broken records are
unreferenced and therefore safe to delete. The last run is saved to
`docs/media-audit-report.txt`.
