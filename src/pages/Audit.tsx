import { useState } from 'react'
import { Audit as AuditIcon } from '../components/icons/Icons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAppContext } from '../context/AppContext'

export function Audit() {
  const { state, notify } = useAppContext()
  const [query, setQuery] = useState('')
  const filtered = state.auditEvents.filter((event) => `${event.actor} ${event.action} ${event.target} ${event.result}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="page">
      <div className="page-topbar">
        <div>
          <h1>Audit Log</h1>
          <p>Dense operational history for every mandate, execution, and verdict.</p>
        </div>
        <Button variant="ghost" onClick={() => notify({ tone: 'info', title: 'CSV export staged', message: 'Audit export prepared from the current log.' })}>
          Export as CSV
        </Button>
      </div>

      <div className="audit-filters">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter actor, action, result..." />
      </div>

      <Card className="audit-log">
        <div className="panel-heading">
          <span className="eyebrow">
            <AuditIcon size={16} />
            Full Trace
          </span>
        </div>
        {filtered.map((event) => (
          <p key={event.id}>
            <span>[{event.timestamp}]</span>
            <span className="actor">{event.actor}</span>
            <span>{event.action}</span>
            <span>{event.target}</span>
            <strong className={`result-${event.result}`}>{event.result}</strong>
          </p>
        ))}
      </Card>
    </section>
  )
}
