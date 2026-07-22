/**
 * Light, premium fallback shown in product media slots when a product has no
 * uploaded image. Replaces the old wireframe treatment.
 */
export function ProductImagePlaceholder(props: { label?: string }) {
  return (
    <div aria-hidden="true" className="product-placeholder">
      <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M32 6 54 18v28L32 58 10 46V18L32 6Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <path d="M10 18l22 12 22-12M32 30v28" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
      {props.label ? <small>{props.label}</small> : null}
    </div>
  )
}
