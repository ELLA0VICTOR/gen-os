import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { AuditEvent, EscrowRecord, EvidenceItem, Execution, Mandate, VaultState } from '../mock/types'
import {
  GENOS_CONTRACT_ADDRESS,
  GENOS_ESCROW_ADDRESS,
  connectBradburyWallet,
  parseGenToWei,
  readGenOS,
  waitForAccepted,
  writeEscrow,
  writeGenOS,
  type EthereumProvider,
} from '../lib/genlayer'
import { fetchLiveSnapshot, type LiveContracts } from '../lib/liveState'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
  id: string
  tone: ToastTone
  title: string
  message?: string
}

type AppState = {
  walletAddress: string | null
  network: string
  mandates: Mandate[]
  executions: Execution[]
  evidence: EvidenceItem[]
  escrows: EscrowRecord[]
  auditEvents: AuditEvent[]
  vault: VaultState
  contracts: LiveContracts | null
  liveLoading: boolean
  liveError: string | null
  liveSyncedAt: string | null
  toasts: Toast[]
}

type PersistedSnapshot = Pick<AppState, 'contracts' | 'mandates' | 'executions' | 'evidence' | 'escrows' | 'auditEvents' | 'vault' | 'liveSyncedAt'>

type RawEvaluationExecution = {
  status: string
  required_action: string
  verdict_reason: string
  evaluated_at: string
}

type Action =
  | { type: 'connect_wallet'; address: string }
  | { type: 'disconnect_wallet' }
  | { type: 'restore_wallet'; address: string }
  | { type: 'restore_live_snapshot'; snapshot: PersistedSnapshot }
  | { type: 'add_mandate'; mandate: Mandate }
  | { type: 'live_loading' }
  | {
      type: 'live_loaded'
      snapshot: {
        mandates: Mandate[]
        executions: Execution[]
        evidence: EvidenceItem[]
        escrows: EscrowRecord[]
        auditEvents: AuditEvent[]
        vault: VaultState
        contracts: LiveContracts
      }
    }
  | { type: 'live_failed'; message: string }
  | { type: 'push_toast'; toast: Toast }
  | { type: 'dismiss_toast'; id: string }

const emptyVault: VaultState = {
  address: '',
  escrowContract: '',
  network: 'Bradbury',
  balance: 0,
  authorizedAgents: [],
  transactions: [],
}

const WALLET_STORAGE_KEY = 'genos.walletAddress'
const SNAPSHOT_STORAGE_KEY = 'genos.liveSnapshot'

const initialState: AppState = {
  walletAddress: null,
  network: 'Bradbury',
  mandates: [],
  executions: [],
  evidence: [],
  escrows: [],
  auditEvents: [],
  vault: emptyVault,
  contracts: null,
  liveLoading: false,
  liveError: null,
  liveSyncedAt: null,
  toasts: [],
}

function readPersistedWallet() {
  try {
    return window.localStorage.getItem(WALLET_STORAGE_KEY)
  } catch {
    return null
  }
}

function readPersistedSnapshot(): PersistedSnapshot | null {
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY)
    if (!raw) return null

    const snapshot = JSON.parse(raw) as PersistedSnapshot
    const cacheMatchesContracts =
      snapshot.contracts?.genosAddress === GENOS_CONTRACT_ADDRESS && snapshot.contracts?.escrowAddress === GENOS_ESCROW_ADDRESS

    if (!cacheMatchesContracts) {
      window.localStorage.removeItem(SNAPSHOT_STORAGE_KEY)
      return null
    }

    return snapshot
  } catch {
    return null
  }
}

function persistSnapshot(state: PersistedSnapshot) {
  try {
    window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Cache is a convenience only; live reads are still the source of truth.
  }
}

function getSnapshotSyncedAt() {
  return new Date().toISOString()
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'connect_wallet':
      return { ...state, walletAddress: action.address }
    case 'restore_wallet':
      return { ...state, walletAddress: action.address }
    case 'disconnect_wallet':
      return { ...state, walletAddress: null }
    case 'add_mandate':
      return { ...state, mandates: [action.mandate, ...state.mandates] }
    case 'live_loading':
      return { ...state, liveLoading: true, liveError: null }
    case 'live_loaded':
      {
        const liveSyncedAt = getSnapshotSyncedAt()
      persistSnapshot({
        contracts: action.snapshot.contracts,
        mandates: action.snapshot.mandates,
        executions: action.snapshot.executions,
        evidence: action.snapshot.evidence,
        escrows: action.snapshot.escrows,
        auditEvents: action.snapshot.auditEvents,
        vault: action.snapshot.vault,
        liveSyncedAt,
      })
      return {
        ...state,
        liveLoading: false,
        liveError: null,
        liveSyncedAt,
        contracts: action.snapshot.contracts,
        mandates: action.snapshot.mandates,
        executions: action.snapshot.executions,
        evidence: action.snapshot.evidence,
        escrows: action.snapshot.escrows,
        auditEvents: action.snapshot.auditEvents,
        vault: action.snapshot.vault,
      }
      }
    case 'restore_live_snapshot':
      return {
        ...state,
        ...action.snapshot,
      }
    case 'live_failed':
      return { ...state, liveLoading: false, liveError: action.message }
    case 'push_toast':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, 4) }
    case 'dismiss_toast':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) }
    default:
      return state
  }
}

type AppContextValue = {
  state: AppState
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  addMandate: (mandate: Mandate) => void
  refreshLiveState: () => Promise<void>
  createMandate: (input: CreateMandateInput) => Promise<void>
  submitExecution: (input: SubmitExecutionInput) => Promise<void>
  fundExecution: (input: FundExecutionInput) => Promise<void>
  evaluateExecution: (executionId: number) => Promise<void>
  releaseExecution: (executionId: number) => Promise<void>
  refundExecution: (executionId: number, reason: string) => Promise<void>
  notify: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export type CreateMandateInput = {
  operatorAddress: string
  title: string
  policyText: string
  rulesCsv: string
  riskThreshold: number
  maxPerExecution: number
  totalBudget: number
  expiresAt: string
  vaultAddress: string
}

export type SubmitExecutionInput = {
  mandateId: number
  recipientAddress: string
  amount: number
  description: string
  evidenceUrlsCsv: string
}

export type FundExecutionInput = {
  executionId: number
  recipientAddress: string
  amountGen: string
  note: string
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return String(record.message ?? record.shortMessage ?? record.details ?? record.reason ?? JSON.stringify(record))
  }
  return String(error)
}

function requireWholeGenAmount(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a whole GEN amount greater than zero`)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isEvaluationFinalized(execution: RawEvaluationExecution | null) {
  if (!execution) return false
  return ['approved', 'rejected', 'released'].includes(execution.status) || execution.evaluated_at !== ''
}

async function readExecutionForRecovery(executionId: number) {
  try {
    return await readGenOS<RawEvaluationExecution>('get_execution', [executionId])
  } catch {
    return null
  }
}

async function waitForEvaluationFinality(executionId: number) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await sleep(3000)
    const execution = await readExecutionForRecovery(executionId)
    if (isEvaluationFinalized(execution)) {
      return execution
    }
  }

  return null
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const providerRef = useRef<EthereumProvider | null>(null)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    const persistedWallet = readPersistedWallet()
    if (persistedWallet) {
      dispatch({ type: 'restore_wallet', address: persistedWallet })
    }

    const persistedSnapshot = readPersistedSnapshot()
    if (persistedSnapshot) {
      dispatch({ type: 'restore_live_snapshot', snapshot: persistedSnapshot })
    }

    void refreshLiveState()
  }, [])

  function notify(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
    dispatch({ type: 'push_toast', toast: { id, ...toast } })
    window.setTimeout(() => dispatch({ type: 'dismiss_toast', id }), 4000)
  }

  async function refreshLiveState() {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    dispatch({ type: 'live_loading' })

    refreshInFlightRef.current = (async () => {
      try {
        const snapshot = await fetchLiveSnapshot()
        dispatch({ type: 'live_loaded', snapshot })
      } catch (error) {
        dispatch({ type: 'live_failed', message: formatError(error) })
      } finally {
        refreshInFlightRef.current = null
      }
    })()

    return refreshInFlightRef.current
  }

  async function connectWallet() {
    try {
      const { account, provider } = await connectBradburyWallet()
      providerRef.current = provider
      window.localStorage.setItem(WALLET_STORAGE_KEY, account)
      dispatch({ type: 'connect_wallet', address: account })
      notify({ tone: 'success', title: 'Wallet connected', message: 'Bradbury wallet is ready for signed transactions.' })
    } catch (error) {
      notify({ tone: 'error', title: 'Wallet connection failed', message: formatError(error) })
    }
  }

  function disconnectWallet() {
    providerRef.current = null
    window.localStorage.removeItem(WALLET_STORAGE_KEY)
    dispatch({ type: 'disconnect_wallet' })
    notify({ tone: 'info', title: 'Wallet disconnected' })
  }

  function addMandate(mandate: Mandate) {
    dispatch({ type: 'add_mandate', mandate })
    notify({ tone: 'success', title: 'Mandate staged', message: 'Ready for GenLayer deployment wiring.' })
  }

  async function requireWallet() {
    if (state.walletAddress && providerRef.current) {
      return { account: state.walletAddress as `0x${string}`, provider: providerRef.current }
    }

    const { account, provider } = await connectBradburyWallet()
    providerRef.current = provider
    window.localStorage.setItem(WALLET_STORAGE_KEY, account)
    dispatch({ type: 'connect_wallet', address: account })
    return { account, provider }
  }

  async function createMandate(input: CreateMandateInput) {
    requireWholeGenAmount(input.maxPerExecution, 'Max per-task amount')
    requireWholeGenAmount(input.totalBudget, 'Total mandate budget')

    const { account, provider } = await requireWallet()
    const hash = await writeGenOS(account, provider, 'create_mandate', [
      input.operatorAddress,
      input.title,
      input.policyText,
      input.rulesCsv,
      input.riskThreshold,
      input.maxPerExecution,
      input.totalBudget,
      input.expiresAt,
      input.vaultAddress,
    ])

    notify({ tone: 'info', title: 'Mandate submitted', message: String(hash) })
    await waitForAccepted(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Mandate live on Bradbury' })
  }

  async function submitExecution(input: SubmitExecutionInput) {
    requireWholeGenAmount(input.amount, 'Execution amount')

    const { account, provider } = await requireWallet()
    const hash = await writeGenOS(account, provider, 'submit_execution', [
      input.mandateId,
      input.recipientAddress,
      input.amount,
      input.description,
      input.evidenceUrlsCsv,
    ])

    notify({ tone: 'info', title: 'Execution submitted', message: String(hash) })
    await waitForAccepted(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Execution queued for evaluation' })
  }

  async function fundExecution(input: FundExecutionInput) {
    const { account, provider } = await requireWallet()
    const hash = await writeEscrow(
      account,
      provider,
      'fund_execution',
      [input.executionId, input.recipientAddress, input.note],
      parseGenToWei(input.amountGen),
    )

    notify({ tone: 'info', title: 'Escrow funding submitted', message: String(hash) })
    await waitForAccepted(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Escrow funded on Bradbury' })
  }

  async function evaluateExecution(executionId: number) {
    const { account, provider } = await requireWallet()

    const currentExecution = await readExecutionForRecovery(executionId)
    if (isEvaluationFinalized(currentExecution)) {
      await refreshLiveState()
      notify({
        tone: 'success',
        title: 'Evaluation already finalized',
        message: currentExecution?.verdict_reason || 'The live Bradbury state already contains a verdict.',
      })
      return
    }

    const hash = await writeGenOS(account, provider, 'evaluate_execution', [executionId])

    notify({ tone: 'info', title: 'GenLayer evaluation started', message: String(hash) })

    try {
      await waitForAccepted(hash as `0x${string}`)
    } catch (error) {
      notify({
        tone: 'warning',
        title: 'Checking delayed Bradbury finality',
        message: 'The transaction response was unclear, so GEN-OS is checking the live verdict before marking this as failed.',
      })

      const finalizedExecution = await waitForEvaluationFinality(executionId)
      if (isEvaluationFinalized(finalizedExecution)) {
        await refreshLiveState()
        notify({
          tone: 'success',
          title: 'Execution verdict finalized',
          message: finalizedExecution?.verdict_reason || 'The verdict was found on-chain after delayed finality.',
        })
        return
      }

      throw new Error(`${formatError(error)}. The transaction may still finalize on Bradbury; refresh in a few seconds before retrying.`)
    }

    await refreshLiveState()
    notify({ tone: 'success', title: 'Execution verdict finalized' })
  }

  async function releaseExecution(executionId: number) {
    const { account, provider } = await requireWallet()
    const hash = await writeEscrow(account, provider, 'release_execution', [executionId])

    notify({ tone: 'info', title: 'Release submitted', message: String(hash) })
    await waitForAccepted(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Escrow release finalized' })
  }

  async function refundExecution(executionId: number, reason: string) {
    const { account, provider } = await requireWallet()
    const hash = await writeEscrow(account, provider, 'refund_execution', [executionId, reason])

    notify({ tone: 'info', title: 'Refund submitted', message: String(hash) })
    await waitForAccepted(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Escrow refund finalized' })
  }

  return (
    <AppContext.Provider
      value={{
        state,
        connectWallet,
        disconnectWallet,
        addMandate,
        refreshLiveState,
        createMandate,
        submitExecution,
        fundExecution,
        evaluateExecution,
        releaseExecution,
        refundExecution,
        notify,
        dismissToast: (id) => dispatch({ type: 'dismiss_toast', id }),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider')
  }

  return context
}
