import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Textarea } from '../components/ui/Input'
import { RiskMeter } from '../components/ui/RiskMeter'
import { useAppContext } from '../context/AppContext'
import type { Mandate } from '../mock/types'

const steps = ['Define', 'Policy', 'Budget', 'Review']
const policyOptions = [
  'Block sanctioned addresses',
  'Block mixer contracts',
  'Block unverified contracts',
  'Require delivery evidence before payment',
  'Require GitHub PR + CI pass for software work',
  'Require published content + analytics for marketing',
]

export function MandateCreate() {
  const navigate = useNavigate()
  const { addMandate, state } = useAppContext()
  const [step, setStep] = useState(0)
  const [selectedRules, setSelectedRules] = useState(policyOptions.slice(0, 4))
  const [riskThreshold, setRiskThreshold] = useState(2)
  const [form, setForm] = useState({
    name: 'AI Agent Shipping Mandate',
    operator: '0x8A340271fE75c6bAB65A36d6625Ff9A432fF8421',
    network: 'Bradbury',
    text: 'Release payment only after the agent submits a public pull request, the implementation matches the scope, CI passes, and the preview URL is reachable. Reject unrelated code, stale evidence, or work that exceeds the approved budget.',
    maxPerTask: '1000',
    totalBudget: '6000',
    expiry: '90 days',
    vault: state.vault.address,
  })

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleRule(rule: string) {
    setSelectedRules((current) => (current.includes(rule) ? current.filter((item) => item !== rule) : [...current, rule]))
  }

  function deployMandate() {
    const mandate: Mandate = {
      id: `mandate-${String(state.mandates.length + 1).padStart(3, '0')}`,
      name: form.name,
      creator: state.walletAddress ?? '0x28E7C6DFe94c9F11aD05A8C35B49e091B2d73051',
      operator: form.operator,
      network: form.network,
      status: 'Active',
      text: form.text,
      rules: selectedRules,
      riskThreshold,
      maxPerTask: Number(form.maxPerTask),
      totalBudget: Number(form.totalBudget),
      spent: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      executions: 0,
    }

    addMandate(mandate)
    navigate(`/mandates/${mandate.id}`)
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
            <div className="checkbox-grid">
              {policyOptions.map((rule) => (
                <label key={rule} className="check-row">
                  <input type="checkbox" checked={selectedRules.includes(rule)} onChange={() => toggleRule(rule)} />
                  <span>{rule}</span>
                </label>
              ))}
            </div>
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
            <Input label="Mandate expiry" value={form.expiry} onChange={(event) => update('expiry', event.target.value)} />
            <Input label="Vault source" value={form.vault} onChange={(event) => update('vault', event.target.value)} />
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
            </div>
            <pre className="mandate-text">{form.text}</pre>
          </div>
        )}

        <div className="form-actions">
          <Button variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))}>
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={deployMandate}>
              Deploy Mandate
            </Button>
          )}
        </div>
      </Card>
    </section>
  )
}
