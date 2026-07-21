import { EmptyState } from '@/components/atoms/EmptyState'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import {
  getBlogPosts,
  getBrochures,
  getCapabilities,
  getIndustries,
  getProductFamilies,
  getProducts,
  type ProductFilters,
} from '@/data/catalog'

import { BlogCard, BrochureCard, CapabilityCard, IndustryCard, ProductCard } from './Cards'
import { ProductFilters as ProductFiltersPanel } from './ProductFilters'

type ListingCopy = {
  description?: string | null
  eyebrow?: string | null
  heading: string
}

export async function CapabilityListingSection(props: ListingCopy) {
  const capabilities = await getCapabilities()

  return (
    <section className="section-block">
      <SectionHeading {...props} wide />
      {capabilities.length ? (
        <div className="catalog-grid">
          {capabilities.map((capability, index) => (
            <CapabilityCard capability={capability} index={index} key={capability.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/collections/capabilities"
          actionLabel="Add capabilities"
          message="Add capabilities in Payload to populate CNC, sheet metal, fabrication, welding, and finishing cards."
          title="No capabilities yet"
        />
      )}
    </section>
  )
}

export async function IndustryListingSection(props: ListingCopy) {
  const industries = await getIndustries()

  return (
    <section className="section-block">
      <SectionHeading {...props} wide />
      {industries.length ? (
        <div className="catalog-grid">
          {industries.map((industry, index) => (
            <IndustryCard industry={industry} index={index} key={industry.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/collections/industries"
          actionLabel="Add industries"
          message="Add sector pages in Payload to organize products for each buyer group."
          title="No industries yet"
        />
      )}
    </section>
  )
}

export async function ProductListingSection(
  props: ListingCopy & { filters?: ProductFilters; showFilters?: boolean | null },
) {
  const filters = props.filters ?? {}
  const [families, industries, products] = await Promise.all([
    getProductFamilies(),
    getIndustries(),
    getProducts(filters),
  ])

  return (
    <section className="section-block shop-section">
      <div className="shop-heading-row">
        <SectionHeading
          description={props.description}
          eyebrow={props.eyebrow}
          heading={props.heading}
          wide
        />
        <div className="shop-count">
          <strong>{products.length}</strong>
          <span>{products.length === 1 ? 'product' : 'products'}</span>
        </div>
      </div>
      {families.length ? (
        <div className="shop-chip-row" aria-label="Product families">
          <Link className={!filters.family ? 'active' : undefined} href="/products">
            All
          </Link>
          {families.slice(0, 12).map((family) => (
            <Link
              className={filters.family === family.slug ? 'active' : undefined}
              href={`/products?family=${family.slug}`}
              key={family.id}
            >
              {family.title}
            </Link>
          ))}
        </div>
      ) : null}
      {props.showFilters === false ? null : (
        <ProductFiltersPanel families={families} filters={filters} industries={industries} />
      )}
      {products.length ? (
        <div className="catalog-grid">
          {products.map((product, index) => (
            <ProductCard index={index} key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/collections/products"
          actionLabel="Add products"
          message="Add products in Payload, then connect them to product families, industries, capabilities, brochures, and 3D assets."
          title="No products match this view"
        />
      )}
    </section>
  )
}

export async function BrochureListingSection(props: ListingCopy) {
  const brochures = await getBrochures()

  return (
    <section className="section-block">
      <SectionHeading {...props} wide />
      {brochures.length ? (
        <div className="catalog-grid">
          {brochures.map((brochure, index) => (
            <BrochureCard brochure={brochure} index={index} key={brochure.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/collections/brochures"
          actionLabel="Add brochures"
          message="Upload PDF catalogues and connect them to products, industries, and capabilities."
          title="No brochures yet"
        />
      )}
    </section>
  )
}

export async function BlogListingSection(props: ListingCopy) {
  const posts = await getBlogPosts()

  return (
    <section className="section-block">
      <SectionHeading {...props} wide />
      {posts.length ? (
        <div className="article-list">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/admin/collections/blog-posts"
          actionLabel="Add blog posts"
          message="Publish admin-managed content from Payload to populate this page."
          title="No blog posts yet"
        />
      )}
    </section>
  )
}
import Link from 'next/link'
