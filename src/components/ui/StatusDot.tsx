import { Dot } from '../icons/Icons'

type StatusTone = 'approved' | 'rejected' | 'pending' | 'unknown'

type StatusDotProps = {
  tone: StatusTone
  label: string
}

export function StatusDot({ tone, label }: StatusDotProps) {
  return (
    <span className={`status-indicator status-${tone}`}>
      <Dot size={14} />
      <span>{label}</span>
    </span>
  )
}
