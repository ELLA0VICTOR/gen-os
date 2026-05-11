import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
  strokeWidth?: number
}

function IconShell({ size = 20, strokeWidth = 1.5, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function ShieldCheck(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M10 2.4 4.2 4.8v4.4c0 3.7 2.3 6.8 5.8 8.4 3.5-1.6 5.8-4.7 5.8-8.4V4.8L10 2.4Z" />
      <path d="m7.4 10 1.6 1.6 3.7-4" />
    </IconShell>
  )
}

export function ShieldX(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M10 2.4 4.2 4.8v4.4c0 3.7 2.3 6.8 5.8 8.4 3.5-1.6 5.8-4.7 5.8-8.4V4.8L10 2.4Z" />
      <path d="m8 8 4 4" />
      <path d="m12 8-4 4" />
    </IconShell>
  )
}

export function Vault(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <circle cx="10" cy="10" r="2.4" />
      <path d="M10 7.6v1.3M10 11.1v1.3M7.6 10h1.3M11.1 10h1.3" />
    </IconShell>
  )
}

export function Mandate(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 2.8h6.2L15 6.6v10.6H5V2.8Z" />
      <path d="M11.2 2.8v3.8H15" />
      <path d="M7.3 9h5.4M7.3 11.5h2.9" />
      <rect x="9.8" y="12.5" width="3.8" height="3" rx=".6" />
      <path d="M10.7 12.5v-.8a1 1 0 0 1 2 0v.8" />
    </IconShell>
  )
}

export function Execution(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M3 10h8" />
      <path d="m8.5 6.8 3.2 3.2-3.2 3.2" />
      <path d="M13 4.5h3.5v11H13" />
      <path d="M16.5 10H13" />
    </IconShell>
  )
}

export function Evidence(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M5 3h10v14H5V3Z" />
      <path d="M7.4 7h5.2M7.4 10h3" />
      <path d="m8 13.3 1.2 1.2 2.8-3" />
    </IconShell>
  )
}

export function Audit(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 4h8.5v10H4V4Z" />
      <path d="M6.3 7h4M6.3 9.6h3" />
      <circle cx="13.3" cy="13.3" r="2.5" />
      <path d="m15.1 15.1 1.9 1.9" />
    </IconShell>
  )
}

export function Risk(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4.2 13.5a6.2 6.2 0 1 1 11.6 0" />
      <path d="m10 11 3.4-3.2" />
      <path d="M5.7 13.5h8.6" />
    </IconShell>
  )
}

export function Wallet(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="3" y="5" width="14" height="10" rx="2" />
      <path d="M13 8.5h4v3h-4a1.5 1.5 0 0 1 0-3Z" />
      <path d="M5 5V3.8h8.5V5" />
    </IconShell>
  )
}

export function Agent(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="7" cy="10" r="2.2" />
      <circle cx="14.5" cy="5" r="1.6" />
      <circle cx="14.5" cy="15" r="1.6" />
      <path d="M9 9 13 5.8M9 11l4 3.2" />
      <path d="M5 10H3" />
    </IconShell>
  )
}

export function Chevron(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="m8 5 5 5-5 5" />
    </IconShell>
  )
}

export function Copy(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="7" y="7" width="9" height="9" rx="1.5" />
      <path d="M4 12.5V4h8.5" />
    </IconShell>
  )
}

export function ExternalLink(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M8 5H5v10h10v-3" />
      <path d="M11 5h4v4" />
      <path d="m9 11 6-6" />
    </IconShell>
  )
}

export function Check(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="m4.5 10.2 3.3 3.3 7.7-8" />
    </IconShell>
  )
}

export function Close(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="m5 5 10 10" />
      <path d="m15 5-10 10" />
    </IconShell>
  )
}

export function Menu(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 6h12M4 10h12M4 14h12" />
    </IconShell>
  )
}

export function Loader(props: IconProps) {
  return (
    <IconShell className={`icon-loader ${props.className ?? ''}`} {...props}>
      <path d="M10 3a7 7 0 1 1-6.4 4.2" />
    </IconShell>
  )
}

export function Clock(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.5V10l2.7 1.6" />
    </IconShell>
  )
}

export function Lock(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
      <path d="M7 8.5V6.7a3 3 0 0 1 6 0v1.8" />
    </IconShell>
  )
}

export function Unlock(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
      <path d="M7 8.5V6.7a3 3 0 0 1 5.7-1.3" />
    </IconShell>
  )
}

export function Dot(props: IconProps) {
  const { size = 20, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...rest}>
      <circle cx="10" cy="10" r="3.2" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 10h12" />
      <path d="m11.5 5.5 4.5 4.5-4.5 4.5" />
    </IconShell>
  )
}

export function Filter(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 5h12l-4.6 5.2v4.2L8.6 16v-5.8L4 5Z" />
    </IconShell>
  )
}

export function Plus(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M10 4v12M4 10h12" />
    </IconShell>
  )
}
