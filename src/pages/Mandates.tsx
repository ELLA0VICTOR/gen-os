import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Execution, Plus } from '../components/icons/Icons'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, relativeTime } from '../utils/format'

const filters = ['All', 'Active', 'Paused', 'Completed', 'Expired']

export function Mandates() {
  const { refreshLiveState, state } = useAppContext()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = state.mandates.filter((mandate) => {
    const matchesQuery = `${mandate.name} ${mandate.text}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'All' || mandate.status === filter
    return matchesQuery && matchesFilter
  })

  return (
    <section className="page">
      <div className="page-topbar">
        <div>
          <h1>Mandates</h1>
          <p>Define the rules before any money moves.</p>
        </div>
        <Link className="btn btn-primary btn-md" to="/mandates/new">
          <Plus size={16} />
          New Mandate
        </Link>
      </div>

      <div className="filter-panel">
        <Card className="live-panel">
          <div>
            <span className="eyebrow">Bradbury Mandates</span>
            <strong>
              {state.liveError
                ? 'Live read failed'
                : state.liveLoading
                  ? 'Syncing mandates...'
                  : `${state.contracts?.mandateCount ?? state.mandates.length} on-chain mandates`}
            </strong>
            <p>
              {state.liveError
                ? state.liveError
                : state.liveSyncedAt
                  ? `Last synced ${relativeTime(state.liveSyncedAt)} from accepted Bradbury state.`
                  : 'Waiting for the first live sync.'}
            </p>
          </div>
          <Button variant="secondary" disabled={state.liveLoading} onClick={refreshLiveState}>
            {state.liveLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Card>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search mandates..." />
        <div className="filter-tags">
          {filters.map((item) => (
            <button className={`filter-tag ${filter === item ? 'is-active' : ''}`} key={item} type="button" onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mandate-grid">
        {filtered.map((mandate) => {
          const spent = (mandate.spent / mandate.totalBudget) * 100
          return (
            <Link key={mandate.id} to={`/mandates/${mandate.id}`}>
              <Card clickable className="mandate-card">
                <div className="mandate-card-head">
                  <div>
                    <h2>{mandate.name}</h2>
                    <AddressDisplay address={mandate.creator} />
                  </div>
                  <Tag variant={mandate.status === 'Active' ? 'success' : mandate.status === 'Paused' ? 'warning' : 'default'}>
                    {mandate.status}
                  </Tag>
                </div>
                <p>{mandate.text.slice(0, 150)}...</p>
                <span className="read-link">Read mandate -&gt;</span>
                <div className="budget-block">
                  <div>
                    <span>Spent: {currency(mandate.spent)} GEN</span>
                    <span>Budget: {currency(mandate.totalBudget)} GEN</span>
                  </div>
                  <div className="spend-bar">
                    <span className="spend-fill spend-safe" style={{ width: `${Math.min(100, spent)}%` }} />
                  </div>
                </div>
                <div className="card-meta">
                  <span>
                    <Clock size={14} />
                    {relativeTime(mandate.createdAt)}
                  </span>
                  <span>
                    <Execution size={14} />
                    {mandate.executions} Executions
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="empty-state">
          <h2>No mandates found</h2>
          <p>{state.mandates.length === 0 ? 'Create the first live Bradbury mandate to begin.' : 'Try a different search or status filter.'}</p>
          <Link className="btn btn-primary btn-md" to="/mandates/new">
            New Mandate
          </Link>
        </Card>
      )}
    </section>
  )
}
