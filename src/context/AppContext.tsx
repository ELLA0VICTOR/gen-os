import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { auditEvents } from '../mock/audit'
import { evidence } from '../mock/evidence'
import { executions } from '../mock/executions'
import { mandates } from '../mock/mandates'
import type { AuditEvent, EvidenceItem, Execution, Mandate } from '../mock/types'
import { vault } from '../mock/vault'

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
  vault: typeof vault
  toasts: Toast[]
}

type Action =
  | { type: 'connect_wallet'; address: string }
  | { type: 'disconnect_wallet' }
  | { type: 'add_mandate'; mandate: Mandate }
  | { type: 'push_toast'; toast: Toast }
  | { type: 'dismiss_toast'; id: string }

const initialState: AppState = {
  walletAddress: null,
  network: 'Bradbury',
  mandates,
  executions,
  evidence,
  auditEvents,
  vault,
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
  connectWallet: () => void
  disconnectWallet: () => void
  addMandate: (mandate: Mandate) => void
  notify: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

const demoWallet = '0x8A340271fE75c6bAB65A36d6625Ff9A432fF8421'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  function notify(toast: Omit<Toast, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
    dispatch({ type: 'push_toast', toast: { id, ...toast } })
    window.setTimeout(() => dispatch({ type: 'dismiss_toast', id }), 4000)
  }

  function connectWallet() {
    dispatch({ type: 'connect_wallet', address: demoWallet })
    notify({ tone: 'success', title: 'Wallet connected', message: 'Demo wallet attached to Bradbury.' })
  }

  function disconnectWallet() {
    dispatch({ type: 'disconnect_wallet' })
    notify({ tone: 'info', title: 'Wallet disconnected' })
  }

  function addMandate(mandate: Mandate) {
    dispatch({ type: 'add_mandate', mandate })
    notify({ tone: 'success', title: 'Mandate staged', message: 'Ready for GenLayer deployment wiring.' })
  }

  return (
    <AppContext.Provider
      value={{
        state,
        connectWallet,
        disconnectWallet,
        addMandate,
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
