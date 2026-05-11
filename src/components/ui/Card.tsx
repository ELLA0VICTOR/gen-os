import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  clickable?: boolean
}

export function Card({ children, clickable = false, className = '', ...props }: CardProps) {
  return (
    <div className={`card ${clickable ? 'card-clickable' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}
