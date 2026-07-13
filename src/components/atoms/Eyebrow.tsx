type EyebrowProps = {
  children?: string | null
}

export function Eyebrow(props: EyebrowProps) {
  const { children } = props

  if (!children) {
    return null
  }

  return <p className="eyebrow">{children}</p>
}
