import { Link } from 'react-router-dom'
import { ExternalLink } from '../icons/Icons'
import { Tag } from '../ui/Tag'
import { Logo } from './Navbar'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Intelligent spend governance. On-chain.</p>
          <Tag variant="lilac">Powered by GenLayer</Tag>
        </div>
        <div>
          <h3>Product</h3>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mandates">Mandates</Link>
          <Link to="/executions">Executions</Link>
          <Link to="/vault">Vault</Link>
          <Link to="/audit">Audit</Link>
        </div>
        <div>
          <h3>Resources</h3>
          <a href="https://docs.genlayer.com/" target="_blank" rel="noreferrer">
            Docs
          </a>
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://www.genlayer.com/" target="_blank" rel="noreferrer">
            GenLayer
          </a>
          <a href="https://discord.com/" target="_blank" rel="noreferrer">
            Discord
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>(c) 2026 GenOS. All rights reserved.</span>
        <a href="https://docs.genlayer.com/" target="_blank" rel="noreferrer">
          Built on GenLayer <ExternalLink size={14} />
        </a>
      </div>
    </footer>
  )
}
