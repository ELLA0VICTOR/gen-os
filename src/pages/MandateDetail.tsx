import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Agent, Execution, Lock } from '../components/icons/Icons'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { RiskMeter } from '../components/ui/RiskMeter'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, readableDate } from '../utils/format'

export function MandateDetail() {
  const { id } = useParams()
  const { notify, state, submitExecution } = useAppContext()
  const [showExecutionForm, setShowExecutionForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [executionForm, setExecutionForm] = useState({
    recipient: '0xa75dcA59ED62725D85B16458f28bD4d61D48E534',
    amount: '250',
    description: 'The agent completed the requested implementation and published a public proof link for review.',
    evidenceUrls: 'https://github.com/genlayerlabs/genlayer-js',
  })
  const mandate = state.mandates.find((item) => item.id === id) ?? state.mandates[0]

  if (!mandate) {
    return (
      <section className="page">
        <Card className="empty-state">
          <h1>No mandate found</h1>
          <p>Create a Bradbury mandate first, then execution requests will attach to it here.</p>
          <Link className="btn btn-primary btn-md" to="/mandates/new">
            Create Mandate
          </Link>
        </Card>
      </section>
    )
  }

  const relatedExecutions = state.executions.filter((execution) => execution.mandateId === mandate.id)
  const spent = (mandate.spent / mandate.totalBudget) * 100
  const mandateNumericId = Number(mandate.id.replace('mandate-', ''))

  function updateExecutionForm(key: keyof typeof executionForm, value: string) {
    setExecutionForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmitExecution() {
    setSubmitting(true)

    try {
      await submitExecution({
        mandateId: mandateNumericId,
        recipientAddress: executionForm.recipient,
        amount: Number(executionForm.amount),
        description: executionForm.description,
        evidenceUrlsCsv: executionForm.evidenceUrls,
      })
      setShowExecutionForm(false)
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Execution submission failed',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

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
            <Button variant="primary" onClick={() => setShowExecutionForm((value) => !value)}>
              <Execution size={16} />
              {showExecutionForm ? 'Close Execution Form' : 'Submit Execution'}
            </Button>
            <Button variant="secondary">
              <Agent size={16} />
              Assign Agent
            </Button>
          </Card>

          {showExecutionForm && (
            <Card className="panel">
              <div className="panel-heading">
                <span className="eyebrow">Execution Request</span>
              </div>
              <Input
                label="Recipient"
                value={executionForm.recipient}
                onChange={(event) => updateExecutionForm('recipient', event.target.value)}
              />
              <Input label="Amount" value={executionForm.amount} onChange={(event) => updateExecutionForm('amount', event.target.value)} />
              <Textarea
                label="Description"
                rows={5}
                value={executionForm.description}
                onChange={(event) => updateExecutionForm('description', event.target.value)}
              />
              <Textarea
                label="Evidence URLs"
                hint="Comma or newline separated public URLs."
                rows={4}
                value={executionForm.evidenceUrls}
                onChange={(event) => updateExecutionForm('evidenceUrls', event.target.value)}
              />
              <Button variant="primary" disabled={submitting} onClick={handleSubmitExecution}>
                {submitting ? 'Submitting...' : 'Submit to GenOS'}
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </section>
  )
}
