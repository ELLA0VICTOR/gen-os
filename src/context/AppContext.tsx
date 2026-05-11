import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import type { AuditEvent, EvidenceItem, Execution, Mandate, VaultState } from '../mock/types'
import { connectBradburyWallet, parseGenToWei, waitForFinalized, writeEscrow, writeGenOS, type EthereumProvider } from '../lib/genlayer'
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
  auditEvents: AuditEvent[]
  vault: VaultState
  contracts: LiveContracts | null
  liveLoading: boolean
  liveError: string | null
  liveSyncedAt: string | null
  toasts: Toast[]
}

type Action =
  | { type: 'connect_wallet'; address: string }
  | { type: 'disconnect_wallet' }
  | { type: 'add_mandate'; mandate: Mandate }
  | { type: 'live_loading' }
  | {
      type: 'live_loaded'
      snapshot: {
        mandates: Mandate[]
        executions: Execution[]
        evidence: EvidenceItem[]
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

const initialState: AppState = {
  walletAddress: null,
  network: 'Bradbury',
  mandates: [],
  executions: [],
  evidence: [],
  auditEvents: [],
  vault: emptyVault,
  contracts: null,
  liveLoading: false,
  liveError: null,
  liveSyncedAt: null,
  toasts: [],
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'connect_wallet':
      return { ...state, walletAddress: action.address }
    case 'disconnect_wallet':
      return { ...state, walletAddress: null }
    case 'add_mandate':
      return { ...state, mandates: [action.mandate, ...state.mandates] }
    case 'live_loading':
      return { ...state, liveLoading: true, liveError: null }
    case 'live_loaded':
      return {
        ...state,
        liveLoading: false,
        liveError: null,
        liveSyncedAt: new Date().toISOString(),
        contracts: action.snapshot.contracts,
        mandates: action.snapshot.mandates,
        executions: action.snapshot.executions,
        evidence: action.snapshot.evidence,
        auditEvents: action.snapshot.auditEvents,
        vault: action.snapshot.vault,
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
  return error instanceof Error ? error.message : String(error)
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const providerRef = useRef<EthereumProvider | null>(null)

  useEffect(() => {
    void refreshLiveState()
  }, [])

  function notify(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
    dispatch({ type: 'push_toast', toast: { id, ...toast } })
    window.setTimeout(() => dispatch({ type: 'dismiss_toast', id }), 4000)
  }

  async function refreshLiveState() {
    dispatch({ type: 'live_loading' })

    try {
      const snapshot = await fetchLiveSnapshot()
      dispatch({ type: 'live_loaded', snapshot })
    } catch (error) {
      dispatch({ type: 'live_failed', message: formatError(error) })
    }
  }

  async function connectWallet() {
    try {
      const { account, provider } = await connectBradburyWallet()
      providerRef.current = provider
      dispatch({ type: 'connect_wallet', address: account })
      notify({ tone: 'success', title: 'Wallet connected', message: 'Bradbury wallet is ready for signed transactions.' })
    } catch (error) {
      notify({ tone: 'error', title: 'Wallet connection failed', message: formatError(error) })
    }
  }

  function disconnectWallet() {
    providerRef.current = null
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
    dispatch({ type: 'connect_wallet', address: account })
    return { account, provider }
  }

  async function createMandate(input: CreateMandateInput) {
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
    await waitForFinalized(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Mandate live on Bradbury' })
  }

  async function submitExecution(input: SubmitExecutionInput) {
    const { account, provider } = await requireWallet()
    const hash = await writeGenOS(account, provider, 'submit_execution', [
      input.mandateId,
      input.recipientAddress,
      input.amount,
      input.description,
      input.evidenceUrlsCsv,
    ])

    notify({ tone: 'info', title: 'Execution submitted', message: String(hash) })
    await waitForFinalized(hash as `0x${string}`)
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
    await waitForFinalized(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Escrow funded on Bradbury' })
  }

  async function evaluateExecution(executionId: number) {
    const { account, provider } = await requireWallet()
    const hash = await writeGenOS(account, provider, 'evaluate_execution', [executionId])

    notify({ tone: 'info', title: 'GenLayer evaluation started', message: String(hash) })
    await waitForFinalized(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Execution verdict finalized' })
  }

  async function releaseExecution(executionId: number) {
    const { account, provider } = await requireWallet()
    const hash = await writeEscrow(account, provider, 'release_execution', [executionId])

    notify({ tone: 'info', title: 'Release submitted', message: String(hash) })
    await waitForFinalized(hash as `0x${string}`)
    await refreshLiveState()
    notify({ tone: 'success', title: 'Escrow release finalized' })
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
