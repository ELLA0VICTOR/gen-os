import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Evidence as EvidenceIcon, ExternalLink } from '../components/icons/Icons'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { readableDate } from '../utils/format'

export function Evidence() {
  const { state } = useAppContext()
  const [query, setQuery] = useState('')
  const filtered = state.evidence.filter((item) => `${item.type} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="page">
      <div className="page-topbar">
        <div>
          <h1>Evidence</h1>
          <p>Permanent receipts for policy checks, source URLs, and execution reviews.</p>
        </div>
      </div>

      <div className="filter-panel">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence receipts..." />
      </div>

      {filtered.length === 0 ? (
        <Card className="empty-state">
          <EvidenceIcon size={48} />
          <h2>No evidence yet</h2>
          <p>Execution receipts will appear here after submission.</p>
        </Card>
      ) : (
        <div className="evidence-grid">
          {filtered.map((item) => (
            <Card key={item.id} clickable className="evidence-receipt">
              <div className="receipt-head">
                <Tag variant={item.status === 'Verified' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}>{item.type}</Tag>
                <span>{readableDate(item.timestamp)}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.url}
                <ExternalLink size={14} />
              </a>
              <Link className="mono read-link" to={`/executions/${item.executionId}`}>
                {item.executionId}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
