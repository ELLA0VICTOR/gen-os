import { Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Navbar } from './components/layout/Navbar'
import { Lock, Wallet } from './components/icons/Icons'
import { Button } from './components/ui/Button'
import { Card } from './components/ui/Card'
import { ToastViewport } from './components/ui/Toast'
import { useAppContext } from './context/AppContext'
import { Audit } from './pages/Audit'
import { Dashboard } from './pages/Dashboard'
import { Evidence } from './pages/Evidence'
import { ExecutionDetail } from './pages/ExecutionDetail'
import { Executions } from './pages/Executions'
import { Landing } from './pages/Landing'
import { MandateCreate } from './pages/MandateCreate'
import { MandateDetail } from './pages/MandateDetail'
import { Mandates } from './pages/Mandates'
import { Vault } from './pages/Vault'

function WalletGate() {
  const { connectWallet } = useAppContext()

  return (
    <section className="page wallet-gate-page">
      <Card className="wallet-gate-card">
        <div className="wallet-gate-icon">
          <Lock size={34} />
        </div>
        <span className="eyebrow">Wallet Required</span>
        <h1>Connect to enter GEN//OS.</h1>
        <p>
          Mandates, executions, evidence, audit trails, and vault state are only visible after a Bradbury wallet is connected.
        </p>
        <Button variant="primary" size="lg" onClick={connectWallet}>
          <Wallet size={18} />
          Connect Wallet
        </Button>
      </Card>
    </section>
  )
}

function RouteFrame() {
  const location = useLocation()
  const { state } = useAppContext()
  const isPublicRoute = location.pathname === '/'
  const canViewRoute = isPublicRoute || Boolean(state.walletAddress)

  return (
    <main className="route-frame" key={location.pathname}>
      {canViewRoute ? (
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mandates" element={<Mandates />} />
          <Route path="/mandates/new" element={<MandateCreate />} />
          <Route path="/mandates/:id" element={<MandateDetail />} />
          <Route path="/executions" element={<Executions />} />
          <Route path="/executions/:id" element={<ExecutionDetail />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/vault" element={<Vault />} />
        </Routes>
      ) : (
        <WalletGate />
      )}
    </main>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-shell">
        <div className="grid-canvas" aria-hidden="true" />
        <Navbar />
        <RouteFrame />
        <ToastViewport />
      </div>
    </AppProvider>
  )
}
