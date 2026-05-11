import { Link, useParams } from 'react-router-dom'
import { Agent, Execution, Lock } from '../components/icons/Icons'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RiskMeter } from '../components/ui/RiskMeter'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, readableDate } from '../utils/format'

export function MandateDetail() {
  const { id } = useParams()
  const { state } = useAppContext()
  const mandate = state.mandates.find((item) => item.id === id) ?? state.mandates[0]
  const relatedExecutions = state.executions.filter((execution) => execution.mandateId === mandate.id)
  const spent = (mandate.spent / mandate.totalBudget) * 100

  return (
    <section className="page">
      <div className="detail-hero">
        <div>
          <p className="eyebrow">Mandate / {mandate.id}</p>
          <h1>{mandate.name}</h1>
          <p>{mandate.text}</p>
        </div>
        <Tag variant={mandate.status === 'Active' ? 'success' : 'warning'}>{mandate.status}</Tag>
      </div>

      <div className="detail-grid">
        <div className="stack">
          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Natural-Language Policy</span>
            </div>
            <pre className="mandate-text">{mandate.text}</pre>
          </Card>

          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Mandate Rules</span>
            </div>
            <div className="rule-list">
              {mandate.rules.map((rule) => (
                <span key={rule}>
                  <Lock size={15} />
                  {rule}
                </span>
              ))}
            </div>
          </Card>

          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Linked Executions</span>
              <Link to="/executions">Open queue</Link>
            </div>
            <div className="feed-list">
              {relatedExecutions.map((execution) => (
                <Link className="feed-row" key={execution.id} to={`/executions/${execution.id}`}>
                  <span className="mono">{execution.id}</span>
                  <span>{execution.status}</span>
                  <span>${currency(execution.amount)}</span>
                  <RiskMeter level={execution.risk} compact />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        <aside className="sticky-panel">
          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Control Plane</span>
            </div>
            <div className="meta-list">
              <span>
                <strong>Creator</strong>
                <AddressDisplay address={mandate.creator} />
              </span>
              <span>
                <strong>Operator</strong>
                <AddressDisplay address={mandate.operator} />
              </span>
              <span>
                <strong>Network</strong>
                <Tag variant="lilac">{mandate.network}</Tag>
              </span>
              <span>
                <strong>Expires</strong>
                {readableDate(mandate.expiresAt)}
              </span>
            </div>
            <div className="budget-block">
              <div>
                <span>${currency(mandate.spent)} spent</span>
                <span>${currency(mandate.totalBudget)} cap</span>
              </div>
              <div className="spend-bar">
                <span className="spend-fill spend-safe" style={{ width: `${Math.min(100, spent)}%` }} />
              </div>
            </div>
            <RiskMeter level={mandate.riskThreshold} />
            <Button variant="primary">
              <Execution size={16} />
              Submit Execution
            </Button>
            <Button variant="secondary">
              <Agent size={16} />
              Assign Agent
            </Button>
          </Card>
        </aside>
      </div>
    </section>
  )
}
