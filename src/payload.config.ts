import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { collections } from './collections'
import { Users } from './collections/Users'
import { gmailEmailAdapter } from './email/gmail'
import { globals } from './globals'
import { cloudinaryStorage } from './storage/cloudinary'
import { localDeliveryManifest, serveLocalCopies } from './storage/localDelivery'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections,
  globals,
  editor: lexicalEditor(),
  // Gmail SMTP when SMTP_USER and SMTP_PASS are set; see src/email/gmail.ts.
  email: gmailEmailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  sharp,
  plugins: [
    cloudinaryStorage({
      collections: {
        // Brochures and 3D assets gate reads on `isPublic`, so their bytes keep
        // flowing through Payload's /api/<collection>/file route.
        brochures: true,
        // Media is world-readable, so skip the proxy and serve Cloudinary's CDN
        // URL directly.
        media: { disablePayloadAccessControl: true },
        'three-d-assets': true,
      },
      // Serve files the deployment already carries instead of spending
      // Cloudinary credits on them. See src/storage/localDelivery.ts.
      localDelivery: serveLocalCopies ? localDeliveryManifest : undefined,
      rootFolder: 'skywings',
    }),
  ],
})
