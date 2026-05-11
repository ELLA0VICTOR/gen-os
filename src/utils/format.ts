export function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(value)
}

export function percent(value: number) {
  return `${value.toFixed(1)}%`
}

export function relativeTime(dateInput: string) {
  const date = new Date(dateInput)
  const diff = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))

  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function readableDate(dateInput: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateInput))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
