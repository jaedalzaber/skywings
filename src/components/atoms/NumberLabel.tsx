type NumberLabelProps = {
  value: number
}

export function NumberLabel(props: NumberLabelProps) {
  return <span className="card-number">{String(props.value).padStart(2, '0')}</span>
}
