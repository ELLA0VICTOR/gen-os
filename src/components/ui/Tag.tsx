import type { ReactNode } from 'react'

type TagVariant = 'default' | 'success' | 'danger' | 'warning' | 'lilac' | 'risk-0' | 'risk-1' | 'risk-2' | 'risk-3' | 'risk-4'

type TagProps = {
  variant?: TagVariant
  children: ReactNode
  className?: string
}

export function Tag({ variant = 'default', children, className = '' }: TagProps) {
  return <span className={`tag tag-${variant} ${className}`}>{children}</span>
}
