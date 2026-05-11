import { GENOS_CONTRACT_ADDRESS, GENOS_ESCROW_ADDRESS, readEscrow, readGenOS } from './genlayer'
import type { AuditEvent, EscrowRecord, EvidenceItem, Execution, ExecutionStatus, Mandate, MandateStatus, VaultState } from '../mock/types'

type RawFullState = {
  admin: string
  audit_count: number
  execution_count: number
  mandate_count: number
  settlement_router: string
}

type RawMandate = {
  id: number
  creator: string
  operator: string
  title: string
  policy_text: string
  rules: string[]
  risk_threshold: number
  max_per_execution: number
  total_budget: number
  spent: number
  vault_address: string
  status: string
  created_at: string
  expires_at: string
  execution_count: number
}

type RawExecution = {
  id: number
  mandate_id: number
  requester: string
  recipient: string
  amount: number
  description: string
  evidence_urls: string[]
  status: string
  risk_level: number
  required_action: 'release_payment' | 'hold_funds' | 'manual_review' | string
  verdict_reason: string
  evidence_summary: string
  submitted_at: string
  evaluated_at: string
  settlement_tx: string
}

type RawAudit = {
  timestamp: string
  actor: string
  action: string
  target_id: number
  result: string
  details: string
}

type RawEscrowTotals = {
  total_locked: number | string
  total_released: number | string
  total_refunded: number | string
  native_balance: number | string
}

type RawEscrowLog = {
  timestamp: string
  actor: string
  execution_id: number
  action: string
  amount: number | string
  details: string
}

type RawEscrow = {
  execution_id: number
  depositor: string
  recipient: string
  amount: number | string
  status: string
  created_at: string
  released_at: string
  refunded_at: string
  note: string
}

const REQUEST_DELAY_MS = 350

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export type LiveContracts = {
  genosAddress: string
  escrowAddress: string
  admin: string
  settlementRouter: string
  mandateCount: number
  executionCount: number
  auditCount: number
}

export type LiveSnapshot = {
  contracts: LiveContracts
  mandates: Mandate[]
  executions: Execution[]
  evidence: EvidenceItem[]
  auditEvents: AuditEvent[]
  escrows: EscrowRecord[]
  vault: VaultState
}

const executionStatusMap: Record<string, ExecutionStatus> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  released: 'Released',
  expired: 'Expired',
}

const mandateStatusMap: Record<string, MandateStatus> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  expired: 'Expired',
}

function toNumber(value: number | string | undefined) {
  if (typeof value === 'number') return value
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function fromWei(value: number | string | undefined) {
  return toNumber(value) / 1_000_000_000_000_000_000
}

function statusLabel(value: string, map: Record<string, string>, fallback: string) {
  return map[value.toLowerCase()] ?? fallback
}

function targetFromAudit(event: RawAudit) {
  const prefix = event.action.includes('MANDATE') ? 'mandate' : event.action.includes('EXECUTION') ? 'execution' : 'system'
  return prefix === 'system' ? 'system' : `${prefix}-${event.target_id}`
}

function toMandate(raw: RawMandate): Mandate {
  return {
    id: `mandate-${raw.id}`,
    name: raw.title,
    creator: raw.creator,
    operator: raw.operator,
    network: 'Bradbury',
    status: statusLabel(raw.status, mandateStatusMap, 'Paused') as MandateStatus,
    text: raw.policy_text,
    rules: raw.rules,
    riskThreshold: raw.risk_threshold,
    maxPerTask: raw.max_per_execution,
    totalBudget: raw.total_budget,
    spent: raw.spent,
    createdAt: raw.created_at,
    expiresAt: raw.expires_at || 'No expiry set',
    executions: raw.execution_count,
  }
}

function toExecution(raw: RawExecution): Execution {
  const status = statusLabel(raw.status, executionStatusMap, 'Pending') as ExecutionStatus
  const approved = status === 'Approved' || status === 'Released'
  const rejected = status === 'Rejected'

  return {
    id: `execution-${raw.id}`,
    mandateId: `mandate-${raw.mandate_id}`,
    status,
    requester: raw.requester,
    vendor: raw.recipient,
    amount: raw.amount,
    risk: raw.risk_level,
    submittedAt: raw.submitted_at,
    description: raw.description,
    verdict: raw.verdict_reason || 'Awaiting GenLayer evaluation',
    requiredAction:
      raw.required_action === 'release_payment' || raw.required_action === 'hold_funds' || raw.required_action === 'manual_review'
        ? raw.required_action
        : 'manual_review',
    checks: [
      { label: 'Evidence URLs submitted', passed: raw.evidence_urls.length > 0 },
      { label: 'Risk within mandate threshold', passed: approved },
      { label: 'Release authorized', passed: approved && raw.required_action === 'release_payment' },
      { label: 'Rejected by validators', passed: !rejected },
    ],
  }
}

function toEvidence(execution: RawExecution): EvidenceItem[] {
  const status = execution.status === 'approved' || execution.status === 'released' ? 'Verified' : execution.status === 'rejected' ? 'Rejected' : 'Pending'

  return execution.evidence_urls.map((url, index) => ({
    id: `evidence-${execution.id}-${index}`,
    executionId: `execution-${execution.id}`,
    type: index === 0 ? 'Primary Source' : 'Supporting Source',
    title: `Evidence source ${index + 1}`,
    description: execution.evidence_summary || execution.description,
    url,
    status,
    timestamp: execution.evaluated_at || execution.submitted_at,
  }))
}

function toAuditEvent(raw: RawAudit, index: number): AuditEvent {
  return {
    id: `audit-${index}-${raw.timestamp}`,
    timestamp: raw.timestamp,
    actor: raw.actor,
    action: raw.action,
    target: targetFromAudit(raw),
    result: raw.result,
  }
}

function toVault(totals: RawEscrowTotals, logs: RawEscrowLog[], contracts: LiveContracts): VaultState {
  return {
    address: contracts.genosAddress,
    escrowContract: contracts.escrowAddress,
    network: 'Bradbury',
    balance: fromWei(totals.native_balance),
    authorizedAgents: [contracts.admin, contracts.settlementRouter].filter(Boolean),
    transactions: logs.map((event, index) => ({
      id: `escrow-log-${index}`,
      type: event.action,
      amount: fromWei(event.amount),
      counterparty: event.actor,
      txHash: event.details || `execution-${event.execution_id}`,
      time: event.timestamp,
    })),
  }
}

function toEscrow(raw: RawEscrow): EscrowRecord {
  return {
    executionId: `execution-${raw.execution_id}`,
    depositor: raw.depositor,
    recipient: raw.recipient,
    amount: fromWei(raw.amount),
    status: raw.status,
    createdAt: raw.created_at,
    releasedAt: raw.released_at,
    refundedAt: raw.refunded_at,
    note: raw.note,
  }
}

export async function fetchLiveSnapshot(): Promise<LiveSnapshot> {
  const fullState = await readGenOS<RawFullState>('get_full_state')
  await sleep(REQUEST_DELAY_MS)
  const auditEvents = await readGenOS<RawAudit[]>('get_audit_log')
  await sleep(REQUEST_DELAY_MS)
  const escrowTotals = await readEscrow<RawEscrowTotals>('get_totals')
  await sleep(REQUEST_DELAY_MS)
  const escrowLog = await readEscrow<RawEscrowLog[]>('get_escrow_log')
  await sleep(REQUEST_DELAY_MS)
  const escrowIds = await readEscrow<number[]>('get_escrow_ids')

  const contracts: LiveContracts = {
    genosAddress: GENOS_CONTRACT_ADDRESS,
    escrowAddress: GENOS_ESCROW_ADDRESS,
    admin: fullState.admin,
    settlementRouter: fullState.settlement_router,
    mandateCount: fullState.mandate_count,
    executionCount: fullState.execution_count,
    auditCount: fullState.audit_count,
  }

  const rawMandates: RawMandate[] = []
  for (let index = 0; index < fullState.mandate_count; index += 1) {
    await sleep(REQUEST_DELAY_MS)
    rawMandates.push(await readGenOS<RawMandate>('get_mandate', [index]))
  }

  const rawExecutions: RawExecution[] = []
  for (let index = 0; index < fullState.execution_count; index += 1) {
    await sleep(REQUEST_DELAY_MS)
    rawExecutions.push(await readGenOS<RawExecution>('get_execution', [index]))
  }

  const rawEscrows: RawEscrow[] = []
  for (const escrowId of escrowIds) {
    await sleep(REQUEST_DELAY_MS)
    rawEscrows.push(await readEscrow<RawEscrow>('get_escrow', [escrowId]))
  }

  return {
    contracts,
    mandates: rawMandates.map(toMandate),
    executions: rawExecutions.map(toExecution),
    evidence: rawExecutions.flatMap(toEvidence),
    escrows: rawEscrows.map(toEscrow),
    auditEvents: auditEvents.map(toAuditEvent).reverse(),
    vault: toVault(escrowTotals, escrowLog.reverse(), contracts),
  }
}
