import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Clock, ExternalLink, Loader, ShieldCheck, ShieldX } from '../components/icons/Icons'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { RiskMeter } from '../components/ui/RiskMeter'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, readableDate } from '../utils/format'

export function ExecutionDetail() {
  const { id } = useParams()
  const { evaluateExecution, fundExecution, releaseExecution, state, notify } = useAppContext()
  const [busyAction, setBusyAction] = useState<'fund' | 'evaluate' | 'release' | null>(null)
  const [fundAmount, setFundAmount] = useState('0.01')
  const execution = state.executions.find((item) => item.id === id) ?? state.executions[0]

  if (!execution) {
    return (
      <section className="page">
        <Card className="empty-state">
          <h1>No execution found</h1>
          <p>Submit an execution from a mandate detail page, then GenLayer verdicts will appear here.</p>
          <Link className="btn btn-primary btn-md" to="/mandates">
            Open Mandates
          </Link>
        </Card>
      </section>
    )
  }

  const mandate = state.mandates.find((item) => item.id === execution.mandateId) ?? state.mandates[0]
  const evidence = state.evidence.filter((item) => item.executionId === execution.id)
  const approved = execution.status === 'Approved' || execution.status === 'Released'
  const rejected = execution.status === 'Rejected'
  const executionNumericId = Number(execution.id.replace('execution-', ''))

  async function handleEvaluate() {
    setBusyAction('evaluate')

    try {
      await evaluateExecution(executionNumericId)
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Evaluation failed',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusyAction(null)
    }
  }

  async function handleFund() {
    setBusyAction('fund')

    try {
      await fundExecution({
        executionId: executionNumericId,
        recipientAddress: execution.vendor,
        amountGen: fundAmount,
        note: `Escrow for ${execution.id}`,
      })
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Escrow funding failed',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusyAction(null)
    }
  }

  async function handleRelease() {
    setBusyAction('release')

    try {
      await releaseExecution(executionNumericId)
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Release failed',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="page">
      <div className="execution-detail-grid">
        <div className="stack">
          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Execution Request</span>
              <Tag variant={approved ? 'success' : rejected ? 'danger' : 'warning'}>{execution.status}</Tag>
            </div>
            <div className="request-grid">
              <span>Mandate</span>
              {mandate ? <Link to={`/mandates/${mandate.id}`}>{mandate.name}</Link> : <strong>Unknown mandate</strong>}
              <span>Requested by</span>
              <AddressDisplay address={execution.requester} />
              <span>Vendor</span>
              <AddressDisplay address={execution.vendor} />
              <span>Amount</span>
              <strong>${currency(execution.amount)} USDC</strong>
              <span>Submitted</span>
              <strong>{readableDate(execution.submittedAt)}</strong>
            </div>
          </Card>

          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Execution Description</span>
            </div>
            <p className="long-copy">{execution.description}</p>
          </Card>

          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">Evidence Submitted</span>
            </div>
            <div className="evidence-list">
              {evidence.map((item) => (
                <a className="evidence-card" key={item.id} href={item.url} target="_blank" rel="noreferrer">
                  <div>
                    <Tag variant={item.status === 'Verified' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}>
                      {item.type}
                    </Tag>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <span>
                      {item.url}
                      <ExternalLink size={14} />
                    </span>
                  </div>
                  {item.status === 'Verified' ? <ShieldCheck /> : item.status === 'Rejected' ? <ShieldX /> : <Clock />}
                </a>
              ))}
            </div>
          </Card>
        </div>

        <aside className="decision-panel">
          <Card className="panel">
            <div className="panel-heading">
              <span className="eyebrow">GenLayer Verdict</span>
            </div>
            <div className={`verdict-display ${approved ? 'is-approved' : rejected ? 'is-rejected' : 'is-pending'}`}>
              {approved ? <ShieldCheck size={48} /> : rejected ? <ShieldX size={48} /> : <Loader size={48} />}
              <strong>{approved ? 'APPROVED' : rejected ? 'REJECTED' : 'EVALUATING...'}</strong>
            </div>
            <RiskMeter level={execution.risk} />
            <div className="reason-block">
              <span>Reason</span>
              <p>{execution.verdict}</p>
            </div>
            <Tag variant="lilac">{execution.requiredAction}</Tag>
            <div className="checklist">
              {execution.checks.map((check) => (
                <span key={check.label} className={check.passed ? 'is-pass' : 'is-fail'}>
                  {check.passed ? <Check size={15} /> : <ShieldX size={15} />}
                  {check.label}
                </span>
              ))}
            </div>
            {execution.status !== 'Released' && (
              <div className="fund-block">
                <Input label="Escrow amount (GEN)" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} />
                <Button variant="secondary" disabled={busyAction !== null} onClick={handleFund}>
                  {busyAction === 'fund' ? 'Funding...' : 'Fund Escrow'}
                </Button>
              </div>
            )}
            {execution.status === 'Pending' && (
              <Button variant="primary" disabled={busyAction !== null} onClick={handleEvaluate}>
                {busyAction === 'evaluate' ? 'Evaluating...' : 'Run GenLayer Evaluation'}
              </Button>
            )}
            {approved && execution.status !== 'Released' && (
              <Button variant="primary" disabled={busyAction !== null} onClick={handleRelease}>
                {busyAction === 'release' ? 'Releasing...' : 'Release Escrow'}
              </Button>
            )}
            <Button variant="danger" onClick={() => notify({ tone: 'warning', title: 'Escalation staged', message: 'Manual override flow opened.' })}>
              Override / Escalate
            </Button>
          </Card>
        </aside>
      </div>
    </section>
  )
}
