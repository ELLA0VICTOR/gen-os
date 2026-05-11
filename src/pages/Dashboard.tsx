import { Link } from 'react-router-dom'
import { Audit, Execution, Mandate, ShieldCheck, Vault } from '../components/icons/Icons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RiskMeter } from '../components/ui/RiskMeter'
import { StatusDot } from '../components/ui/StatusDot'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, percent, relativeTime } from '../utils/format'

const metricIcons = [Vault, Mandate, Execution, ShieldCheck]

export function Dashboard() {
  const { refreshLiveState, state } = useAppContext()
  const pending = state.executions.filter((execution) => execution.status === 'Pending').length
  const approved = state.executions.filter((execution) => execution.status === 'Approved' || execution.status === 'Released').length
  const compliance = (approved / Math.max(1, state.executions.length)) * 100

  const metrics = [
    { label: 'Native GEN Locked', value: `${currency(state.vault.balance)} GEN`, delta: state.contracts ? 'Live escrow read' : 'Local preview' },
    { label: 'Active Mandates', value: String(state.mandates.filter((mandate) => mandate.status === 'Active').length), delta: `${state.contracts?.mandateCount ?? state.mandates.length} on-chain` },
    { label: 'Pending Review', value: String(pending), delta: `${state.contracts?.executionCount ?? state.executions.length} executions` },
    { label: 'Policy Compliance', value: percent(compliance), delta: state.contracts ? 'Bradbury accepted state' : 'Preview state' },
  ]

  return (
    <section className="page page-dashboard">
      <div className="page-header">
        <p className="eyebrow">GEN//OS / Dashboard</p>
        <h1>Command Center</h1>
      </div>

      <Card className="live-panel">
        <div>
          <span className="eyebrow">Bradbury Live State</span>
          <strong>{state.liveError ? 'Contract read needs attention' : state.liveLoading ? 'Syncing accepted state...' : 'Connected to deployed GenOS'}</strong>
          <p>
            {state.liveError
              ? state.liveError
              : state.liveSyncedAt
                ? `Last synced ${relativeTime(state.liveSyncedAt)} from ${state.contracts?.genosAddress}`
                : 'Reading live contract state from Bradbury.'}
          </p>
        </div>
        <Button variant="secondary" disabled={state.liveLoading} onClick={refreshLiveState}>
          {state.liveLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Card>

      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index]
          return (
            <Card key={metric.label} className="metric-card">
              <Icon size={20} />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <Tag>{metric.delta}</Tag>
            </Card>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <Card className="panel execution-feed">
          <div className="panel-heading">
            <span className="eyebrow">Recent Executions</span>
            <Link to="/executions">View all</Link>
          </div>
          <div className="feed-list">
            {state.executions.slice(0, 6).map((execution) => {
              const mandate = state.mandates.find((item) => item.id === execution.mandateId)
              const tone = execution.status === 'Approved' || execution.status === 'Released' ? 'approved' : execution.status === 'Rejected' ? 'rejected' : 'pending'
              return (
                <Link className="feed-row" key={execution.id} to={`/executions/${execution.id}`}>
                  <StatusDot tone={tone} label={execution.status} />
                  <span className="mono">{execution.id}</span>
                  <span>{mandate?.name}</span>
                  <span>{currency(execution.amount)} GEN</span>
                  <RiskMeter level={execution.risk} compact />
                  <span>{relativeTime(execution.submittedAt)}</span>
                </Link>
              )
            })}
            {state.executions.length === 0 && <p>No live executions yet. Create a mandate, then submit an execution request.</p>}
          </div>
        </Card>

        <Card className="panel">
          <div className="panel-heading">
            <span className="eyebrow">Mandate Health</span>
            <Link to="/mandates">Manage</Link>
          </div>
          <div className="health-list">
            {state.mandates.slice(0, 5).map((mandate) => {
              const used = (mandate.spent / mandate.totalBudget) * 100
              const barTone = used >= 95 ? 'danger' : used >= 80 ? 'warning' : 'safe'
              return (
                <Link className="health-row" key={mandate.id} to={`/mandates/${mandate.id}`}>
                  <div>
                    <strong>{mandate.name}</strong>
                    <span>{currency(mandate.totalBudget - mandate.spent)} GEN remaining</span>
                  </div>
                  <div className="spend-bar" aria-label={`${Math.round(used)} percent spent`}>
                    <span className={`spend-fill spend-${barTone}`} style={{ width: `${Math.min(100, used)}%` }} />
                  </div>
                </Link>
              )
            })}
            {state.mandates.length === 0 && <p>No live mandates yet. The first deployed mandate will appear here.</p>}
          </div>
        </Card>
      </div>

      <Card className="audit-strip">
        <div className="panel-heading">
          <span className="eyebrow">
            <Audit size={16} />
            Audit Activity
          </span>
          <Link to="/audit">View Full Audit Log -&gt;</Link>
        </div>
        <div className="audit-lines">
          {state.auditEvents.slice(0, 10).map((event) => (
            <p key={event.id}>
              <span>[{event.timestamp}]</span> <span>{event.actor}</span> <span>{event.action}</span>{' '}
              <strong className={`result-${event.result}`}>{event.result}</strong>
            </p>
          ))}
        </div>
      </Card>
    </section>
  )
}
