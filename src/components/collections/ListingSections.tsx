import { EmptyState } from '@/components/atoms/EmptyState'
import { SectionHeading } from '@/components/atoms/SectionHeading'
import {
  getBlogPosts,
  getBrochures,
  getCapabilities,
  getIndustries,
  getProducts,
  type ProductFilters,
} from '@/data/catalog'
import { getMediaImage } from '@/data/media'
import { relationArray, relationSlug } from '@/data/relations'

import { BlogCard, BrochureCard, CapabilityCard, IndustryCard } from './Cards'
import { ProductsCatalog, type IndustryOption } from './catalog/ProductsCatalog'
import type { ProductLite } from './catalog/ProductShopCard'

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
  const [industries, products] = await Promise.all([getIndustries(), getProducts({})])

  if (!products.length) {
    return (
      <section className="section-block shop-section">
        <EmptyState
          actionHref="/admin/collections/products"
          actionLabel="Add products"
          message="Add products in Payload, then connect them to product families, industries, capabilities, brochures, and 3D assets."
          title="No products yet"
        />
      </section>
    )
  }

  const productsLite: ProductLite[] = products.map((product, index) => {
    const image = getMediaImage(product.thumbnailImage)

    return {
      id: product.id,
      image: image ? { alt: image.alt, url: image.url } : null,
      industrySlugs: relationArray(product.industries)
        .map((item) => relationSlug(item))
        .filter((slug): slug is string => Boolean(slug)),
      number: index + 1,
      sku: product.sku ?? '',
      slug: product.slug,
      summary: product.summary,
      title: product.title,
    }
  })

  const industryOptions: IndustryOption[] = industries.map((industry) => ({
    slug: industry.slug,
    title: industry.title,
  }))

  return (
    <ProductsCatalog
      eyebrow={props.eyebrow}
      heading={props.heading}
      industries={industryOptions}
      initialIndustry={props.filters?.industry}
      products={productsLite}
    />
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
