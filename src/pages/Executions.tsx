import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, Plus } from '../components/icons/Icons'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { RiskMeter } from '../components/ui/RiskMeter'
import { StatusDot } from '../components/ui/StatusDot'
import { useAppContext } from '../context/AppContext'
import type { ExecutionStatus } from '../mock/types'
import { currency, relativeTime } from '../utils/format'

const tabs: Array<'All' | ExecutionStatus> = ['All', 'Pending', 'Approved', 'Rejected', 'Released', 'Expired']

export function Executions() {
  const { state } = useAppContext()
  const [tab, setTab] = useState<'All' | ExecutionStatus>('All')

  const filtered = tab === 'All' ? state.executions : state.executions.filter((execution) => execution.status === tab)

  return (
    <section className="page">
      <div className="page-topbar">
        <div>
          <h1>Executions</h1>
          <p>Pending, approved, and rejected execution requests.</p>
        </div>
        <div className="topbar-actions">
          <Button variant="secondary">
            <Filter size={16} />
            Filter
          </Button>
          <Button variant="primary">
            <Plus size={16} />
            Submit Execution
          </Button>
        </div>
      </div>

      <div className="tabbar">
        {tabs.map((item) => (
          <button key={item} className={tab === item ? 'is-active' : ''} type="button" onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="execution-table">
        <div className="execution-head">
          <span>Status</span>
          <span>ID</span>
          <span>Mandate</span>
          <span>Vendor</span>
          <span>Amount</span>
          <span>Risk</span>
          <span>Submitted</span>
          <span>Action</span>
        </div>
        {filtered.map((execution) => {
          const mandate = state.mandates.find((item) => item.id === execution.mandateId)
          const tone = execution.status === 'Approved' || execution.status === 'Released' ? 'approved' : execution.status === 'Rejected' ? 'rejected' : 'pending'
          return (
            <div className="execution-row" key={execution.id}>
              <StatusDot tone={tone} label={execution.status} />
              <span className="mono">{execution.id}</span>
              <Link to={`/mandates/${mandate?.id}`}>{mandate?.name}</Link>
              <AddressDisplay address={execution.vendor} />
              <span>${currency(execution.amount)}</span>
              <RiskMeter level={execution.risk} compact />
              <span>{relativeTime(execution.submittedAt)}</span>
              <Link className="read-link" to={`/executions/${execution.id}`}>
                {execution.status === 'Pending' ? 'Review' : 'Details'} -&gt;
              </Link>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state card">
          <h2>No executions found</h2>
          <p>{state.executions.length === 0 ? 'Submit an execution from a mandate detail page to start GenLayer evaluation.' : 'Try another status tab.'}</p>
        </div>
      )}
    </section>
  )
}
