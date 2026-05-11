import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { RiskMeter } from '../components/ui/RiskMeter'
import { useAppContext } from '../context/AppContext'
import { GENOS_ESCROW_ADDRESS } from '../lib/genlayer'

const steps = ['Define', 'Policy', 'Budget', 'Review']
const policyOptions = [
  'Require public evidence URLs',
  'Reject inaccessible or private evidence',
  'Reject evidence unrelated to the mandate',
  'Reject stale or unverifiable claims',
  'Require recipient to match the approved operator or vendor',
  'Escalate ambiguous evidence to manual review',
]

function toDateTimeLocal(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16)
}

function toIsoDateTime(value: string) {
  if (!value) return ''
  return new Date(value).toISOString()
}

function toRulesCsv(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim().replaceAll(',', ';'))
    .filter(Boolean)
    .join(',')
}

export function MandateCreate() {
  const navigate = useNavigate()
  const { createMandate, notify, state } = useAppContext()
  const escrowAddress = state.contracts?.escrowAddress || state.vault.escrowContract || GENOS_ESCROW_ADDRESS
  const [step, setStep] = useState(0)
  const [riskThreshold, setRiskThreshold] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: 'Evidence-Gated Payment Mandate',
    operator: '0x8A340271fE75c6bAB65A36d6625Ff9A432fF8421',
    network: 'Bradbury',
    text: 'Release payment only after public evidence proves the requested work was completed, matches the agreed scope, and belongs to the approved recipient. Reject private, stale, unrelated, unverifiable, or ambiguous evidence.',
    rulesText: policyOptions.slice(0, 4).join('\n'),
    maxPerTask: '1000',
    totalBudget: '6000',
    expiry: toDateTimeLocal(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
  })

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function appendRule(rule: string) {
    const currentRules = form.rulesText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (currentRules.includes(rule)) return
    update('rulesText', [...currentRules, rule].join('\n'))
  }

  async function deployMandate() {
    setSubmitting(true)

    try {
      await createMandate({
        operatorAddress: form.operator,
        title: form.name,
        policyText: form.text,
        rulesCsv: toRulesCsv(form.rulesText),
        riskThreshold,
        maxPerExecution: Number(form.maxPerTask),
        totalBudget: Number(form.totalBudget),
        expiresAt: toIsoDateTime(form.expiry),
        vaultAddress: escrowAddress,
      })
      navigate('/mandates')
    } catch (error) {
      notify({
        tone: 'error',
        title: 'Mandate deployment failed',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page form-page">
      <div className="stepper">
        {steps.map((item, index) => (
          <button key={item} className={`step ${step === index ? 'is-active' : ''}`} type="button" onClick={() => setStep(index)}>
            <span>{index + 1}</span>
            {item}
          </button>
        ))}
      </div>

      <Card className="form-card">
        {step === 0 && (
          <div className="form-step">
            <h1>Define the mandate</h1>
            <Input label="Mandate Name" value={form.name} onChange={(event) => update('name', event.target.value)} />
            <Input label="Agent or Operator Address" value={form.operator} onChange={(event) => update('operator', event.target.value)} />
            <Input label="Network" value={form.network} onChange={(event) => update('network', event.target.value)} />
            <Textarea
              label="Natural-Language Mandate"
              value={form.text}
              onChange={(event) => update('text', event.target.value)}
              rows={8}
            />
          </div>
        )}

        {step === 1 && (
          <div className="form-step">
            <h1>Set policy checks</h1>
            <p>
              These presets are optional starters. The contract stores whatever custom rules you write below, so GEN-OS can handle GitHub,
              content, invoices, deliveries, audits, grants, research, or any evidence-based workflow.
            </p>
            <div className="preset-grid">
              {policyOptions.map((rule) => (
                <button key={rule} className="preset-rule" type="button" onClick={() => appendRule(rule)}>
                  + {rule}
                </button>
              ))}
            </div>
            <Textarea
              label="Custom policy rules"
              hint="One rule per line. These rules are sent to the GenLayer contract with your natural-language mandate."
              value={form.rulesText}
              onChange={(event) => update('rulesText', event.target.value)}
              rows={8}
            />
            <label className="field">
              <span className="field-label">Reject if risk level exceeds</span>
              <input
                className="range"
                type="range"
                min="0"
                max="4"
                value={riskThreshold}
                onChange={(event) => setRiskThreshold(Number(event.target.value))}
              />
            </label>
            <RiskMeter level={riskThreshold} />
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h1>Budget and vault</h1>
            <Input label="Max per-task amount" value={form.maxPerTask} onChange={(event) => update('maxPerTask', event.target.value)} />
            <Input label="Total mandate budget" value={form.totalBudget} onChange={(event) => update('totalBudget', event.target.value)} />
            <Input
              label="Mandate expiry"
              type="datetime-local"
              value={form.expiry}
              onChange={(event) => update('expiry', event.target.value)}
            />
            <div className="vault-source-box">
              <span className="field-label">Vault source</span>
              <strong>GEN-OS Escrow Vault</strong>
              {escrowAddress ? <AddressDisplay address={escrowAddress} full /> : <p>Escrow contract address is loading from Bradbury.</p>}
              <p>Auto-selected for Bradbury. Users do not need to paste this manually.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h1>Review mandate</h1>
            <div className="review-grid">
              <span>Name</span>
              <strong>{form.name}</strong>
              <span>Operator</span>
              <strong className="mono">{form.operator}</strong>
              <span>Budget</span>
              <strong>${form.totalBudget} USDC</strong>
              <span>Risk Threshold</span>
              <RiskMeter level={riskThreshold} compact />
              <span>Expiry</span>
              <strong>{form.expiry ? new Date(form.expiry).toLocaleString() : 'No expiry selected'}</strong>
            </div>
            <pre className="mandate-text">{form.text}</pre>
            <pre className="mandate-text">{form.rulesText}</pre>
          </div>
        )}

        <div className="form-actions">
          <Button variant="ghost" disabled={submitting} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button variant="primary" disabled={submitting} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" disabled={submitting || !escrowAddress} onClick={deployMandate}>
              {submitting ? 'Deploying on Bradbury...' : 'Deploy Mandate'}
            </Button>
          )}
        </div>
      </Card>
    </section>
  )
}
