import { useState } from 'react'
import { Check, Copy } from '../icons/Icons'

type AddressDisplayProps = {
  address: string
  full?: boolean
}

export function shortAddress(address: string) {
  if (!address || address.length < 12) return address
  return `${address.slice(0, 8)}...${address.slice(-4)}`
}

export function AddressDisplay({ address, full = false }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  async function copyAddress() {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <span className="address-display">
      <span>{full ? address : shortAddress(address)}</span>
      <button className="icon-button" type="button" onClick={copyAddress} aria-label="Copy address">
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </span>
  )
}
