// Pure cache-tag registry. No framework imports — safe to import from Payload
// collections/globals and from data loaders alike.
export const TAGS = {
  products: 'products',
  product: (slug: string) => `product:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  industries: 'industries',
  capabilities: 'capabilities',
  brochures: 'brochures',
  blog: 'blog',
  post: (slug: string) => `post:${slug}`,
  threeD: 'three-d',
  media: 'media',
  globals: 'globals',
} as const
