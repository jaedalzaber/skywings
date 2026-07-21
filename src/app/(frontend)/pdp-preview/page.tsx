// TEMPORARY visual-verification route — renders ProductDetail with mock data so
// the design can be checked in the browser without touching the products table.
// Lives outside /products so it doesn't hit the [slug] route. Safe to delete.
import { ProductDetail } from '@/components/collections/product/ProductDetail'
import type { Media, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

const img = (url: string, alt: string, width = 1280, height = 720): Media =>
  ({ id: url, alt, url, width, height } as unknown as Media)

const mock = {
  id: 1,
  title: 'Folding Stand',
  slug: 'folding-stand',
  sku: 'GSE-FS-038',
  summary: 'Foldable work stand provides stable elevated access while saving storage space.',
  breadcrumb: 'Aviation / GSE / Stands',
  industryLabel: 'Aviation GSE',
  categoryLabel: 'Maintenance & Stand',
  keySpecs: [
    { id: 'k1', label: 'Type', value: 'Folding' },
    { id: 'k2', label: 'Weight', value: '20kg' },
    { id: 'k3', label: 'Material', value: 'Aluminium' },
    { id: 'k4', label: 'Capacity', value: '200kg' },
    { id: 'k5', label: 'Surface', value: 'Powder Coated' },
    { id: 'k6', label: 'Size', value: '20m x 40m x 20m' },
  ],
  description: {
    root: {
      type: 'root',
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            { type: 'text', version: 1, format: 0, text: 'Sky Wings provides ' },
            { type: 'text', version: 1, format: 1, text: 'End-to-End Metal Manufacturing' },
            {
              type: 'text',
              version: 1,
              format: 0,
              text: '. We take a requirement — a drawing, a sample, a concept, or a problem to solve — and convert it into a ',
            },
            { type: 'text', version: 1, format: 1, text: 'manufactured product' },
            { type: 'text', version: 1, format: 0, text: '.' },
          ],
        },
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              format: 0,
              text: 'Foldable work stand provides stable elevated access while saving storage space when not in use.',
            },
          ],
        },
      ],
    },
  },
  featuredImage: img('/images/products/folding-stand-hero.png', 'Folding stand', 1024, 600),
  gallery: [
    { id: 'g1', image: img('/images/products/thumb-1.png', 'View 1') },
    { id: 'g2', image: img('/images/products/thumb-2.png', 'View 2') },
    { id: 'g3', image: img('/images/products/thumb-3.png', 'View 3') },
    { id: 'g4', image: img('/images/products/thumb-4.png', 'View 4') },
  ],
  howItWorks: {
    heading: 'How it works',
    image: img('/images/products/fold-unfold.png', 'Fold and unfold', 1172, 1010),
    caption: 'Folds flat for storage, unfolds to a 180° working platform.',
  },
  specifications: [
    { id: 's1', label: 'Code', value: 'GSE-OB-04' },
    { id: 's2', label: 'Application', value: '777X and 777 legacy' },
    { id: 's3', label: 'Movement', value: '2 Persons' },
    { id: 's4', label: 'Weight', value: '700', unit: 'kg' },
    { id: 's5', label: 'Material', value: 'Steel Construction' },
    { id: 's6', label: 'Deck Type', value: 'Roller Deck' },
    { id: 's7', label: 'Finish', value: 'Powder Coated' },
    { id: 's8', label: 'Application', value: 'ULD & Cargo Transfer' },
  ],
  accessories: [
    { id: 'a1', label: 'Code', value: 'GSE-OB-04' },
    { id: 'a2', label: 'Application', value: '777X and 777 legacy' },
    { id: 'a3', label: 'Movement', value: '2 Persons' },
    { id: 'a4', label: 'Weight', value: '700 kg' },
    { id: 'a5', label: 'Material', value: 'Steel Construction' },
  ],
  technicalDrawing: img('/images/products/technical-drawing.png', 'Technical drawing', 1600, 1090),
  brochures: [
    { id: 'b1', title: 'Spec sheet', slug: 'spec', url: '/images/products/technical-drawing.png' },
  ],
  configurationOptions: [
    {
      id: 'c1',
      group: 'Material',
      options: [
        { id: 'o1', label: 'Steel', value: 'steel' },
        { id: 'o2', label: 'Aluminium', value: 'aluminium' },
      ],
    },
    {
      id: 'c2',
      group: 'Size',
      options: [
        { id: 'o3', label: '10m', value: '10m' },
        { id: 'o4', label: '20m', value: '20m' },
      ],
    },
    {
      id: 'c3',
      group: 'Finishing',
      options: [
        { id: 'o5', label: 'Paint', value: 'paint' },
        { id: 'o6', label: 'Powder Coating', value: 'powder' },
      ],
    },
    {
      id: 'c4',
      group: 'Wheel Type',
      options: [
        { id: 'o7', label: 'None', value: 'none' },
        { id: 'o8', label: 'Pneumatic Tires', value: 'pneumatic' },
      ],
    },
    {
      id: 'c5',
      group: 'Towbar',
      options: [
        { id: 'o9', label: 'None', value: 'none' },
        { id: 'o10', label: 'Hook', value: 'hook' },
        { id: 'o11', label: 'Free', value: 'free' },
      ],
    },
    {
      id: 'c6',
      group: 'Color',
      options: [
        { id: 'o12', label: 'Blue', value: 'blue', swatch: '#3d47ff' },
        { id: 'o13', label: 'White', value: 'white', swatch: '#f0f0f0' },
        { id: 'o14', label: 'Custom', value: 'custom' },
      ],
    },
  ],
} as unknown as Product

const related = [
  {
    id: 2,
    title: 'Aircraft Maintenance Platforms',
    slug: 'aircraft-maintenance-platforms',
    featuredImage: img('/images/products/related-platforms.png', 'Platforms'),
  },
  {
    id: 3,
    title: 'Straight Ladders',
    slug: 'straight-ladders',
    featuredImage: img('/images/products/related-ladders.png', 'Ladders'),
  },
  {
    id: 4,
    title: 'Cargo Stairs',
    slug: 'cargo-stairs',
    featuredImage: img('/images/products/related-cargo.png', 'Cargo stairs'),
  },
  {
    id: 5,
    title: 'Maintenance Stair',
    slug: 'maintenance-stair',
    featuredImage: img('/images/products/related-stair.png', 'Maintenance stair'),
  },
] as unknown as Product[]

export default function ProductPreviewPage() {
  return <ProductDetail product={mock} related={related} />
}
