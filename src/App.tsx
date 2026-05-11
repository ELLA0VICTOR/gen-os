import { Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Navbar } from './components/layout/Navbar'
import { ToastViewport } from './components/ui/Toast'
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

function RouteFrame() {
  const location = useLocation()

  return (
    <main className="route-frame" key={location.pathname}>
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
