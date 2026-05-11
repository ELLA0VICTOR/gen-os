export type MandateStatus = 'Active' | 'Paused' | 'Completed' | 'Expired'
export type ExecutionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired'
export type EvidenceStatus = 'Verified' | 'Pending' | 'Rejected'

export type Mandate = {
  id: string
  name: string
  creator: string
  operator: string
  network: string
  status: MandateStatus
  text: string
  rules: string[]
  riskThreshold: number
  maxPerTask: number
  totalBudget: number
  spent: number
  createdAt: string
  expiresAt: string
  executions: number
}

export type Execution = {
  id: string
  mandateId: string
  status: ExecutionStatus
  requester: string
  vendor: string
  amount: number
  risk: number
  submittedAt: string
  description: string
  verdict: string
  requiredAction: 'release_payment' | 'hold_funds' | 'manual_review'
  checks: Array<{ label: string; passed: boolean }>
}

export type EvidenceItem = {
  id: string
  executionId: string
  type: string
  title: string
  description: string
  url: string
  status: EvidenceStatus
  timestamp: string
}

export type AuditEvent = {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  result: 'approved' | 'rejected' | 'pending' | 'created' | 'released'
}

export type VaultState = {
  address: string
  escrowContract: string
  network: string
  balance: number
  authorizedAgents: string[]
  transactions: Array<{
    id: string
    type: 'Deposit' | 'Release' | 'Hold' | 'Withdrawal'
    amount: number
    counterparty: string
    txHash: string
    time: string
  }>
}
