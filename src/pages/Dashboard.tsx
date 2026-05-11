import { Link } from 'react-router-dom'
import { Audit, Execution, Mandate, ShieldCheck, Vault } from '../components/icons/Icons'
import { Card } from '../components/ui/Card'
import { RiskMeter } from '../components/ui/RiskMeter'
import { StatusDot } from '../components/ui/StatusDot'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, percent, relativeTime } from '../utils/format'

const metricIcons = [Vault, Mandate, Execution, ShieldCheck]

export function Dashboard() {
  const { state } = useAppContext()
  const pending = state.executions.filter((execution) => execution.status === 'Pending').length
  const approved = state.executions.filter((execution) => execution.status === 'Approved').length
  const compliance = (approved / Math.max(1, state.executions.length)) * 100

  const metrics = [
    { label: 'Total Locked', value: `$${currency(state.vault.balance)}`, delta: '+$10k this week' },
    { label: 'Active Mandates', value: String(state.mandates.filter((mandate) => mandate.status === 'Active').length), delta: '+2 this week' },
    { label: 'Pending Review', value: String(pending), delta: '3 under SLA' },
    { label: 'Policy Compliance', value: percent(compliance), delta: '+4.1% this month' },
  ]

  return (
    <section className="page page-dashboard">
      <div className="page-header">
        <p className="eyebrow">GEN//OS / Dashboard</p>
        <h1>Command Center</h1>
      </div>

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
              const tone = execution.status === 'Approved' ? 'approved' : execution.status === 'Rejected' ? 'rejected' : 'pending'
              return (
                <Link className="feed-row" key={execution.id} to={`/executions/${execution.id}`}>
                  <StatusDot tone={tone} label={execution.status} />
                  <span className="mono">{execution.id}</span>
                  <span>{mandate?.name}</span>
                  <span>${currency(execution.amount)}</span>
                  <RiskMeter level={execution.risk} compact />
                  <span>{relativeTime(execution.submittedAt)}</span>
                </Link>
              )
            })}
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
                    <span>${currency(mandate.totalBudget - mandate.spent)} remaining</span>
                  </div>
                  <div className="spend-bar" aria-label={`${Math.round(used)} percent spent`}>
                    <span className={`spend-fill spend-${barTone}`} style={{ width: `${Math.min(100, used)}%` }} />
                  </div>
                </Link>
              )
            })}
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
