import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Close, Wallet } from '../icons/Icons'
import { AddressDisplay } from '../ui/AddressDisplay'
import { Button } from '../ui/Button'
import { StatusDot } from '../ui/StatusDot'
import { Tag } from '../ui/Tag'
import { useWallet } from '../../hooks/useWallet'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Mandates', to: '/mandates' },
  { label: 'Executions', to: '/executions' },
  { label: 'Evidence', to: '/evidence' },
  { label: 'Audit', to: '/audit' },
  { label: 'Vault', to: '/vault' },
]

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="GEN OS home">
      GEN<span>//</span>OS
    </Link>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { address, connected, network, connectWallet, disconnectWallet } = useWallet()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="wallet-zone">
          {connected && address ? (
            <>
              <AddressDisplay address={address} />
              <StatusDot tone="approved" label="Live" />
              <Tag variant="lilac">{network}</Tag>
              <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={connectWallet}>
              <Wallet size={16} />
              Connect Wallet
            </Button>
          )}
        </div>
        <button className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
          {open ? <Close /> : <Menu />}
        </button>
      </div>
      <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
        {navItems.map((item) => (
          <NavLink key={item.to} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} to={item.to}>
            {item.label}
          </NavLink>
        ))}
        <div className="mobile-wallet">
          {connected && address ? (
            <AddressDisplay address={address} />
          ) : (
            <Button variant="primary" onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
