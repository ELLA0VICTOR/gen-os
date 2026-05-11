import { Link } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { ArrowRight, Execution, ShieldCheck } from '../components/icons/Icons'
import { Tag } from '../components/ui/Tag'

export function Landing() {
  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-animate hero-delay-0">
            <Tag variant="lilac">Powered by GenLayer</Tag>
          </div>
          <h1 className="hero-title hero-animate hero-delay-1">
            Spend governance that thinks before it pays.
          </h1>
          <p className="hero-copy hero-animate hero-delay-2">
            Give an agent a mandate. GenOS verifies evidence, checks risk, and only releases escrow when the work is
            proven and the policy is met.
          </p>
          <div className="hero-actions hero-animate hero-delay-3">
            <Link className="btn btn-primary btn-lg" to="/mandates/new">
              Create a Mandate
              <ArrowRight size={18} />
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/executions/exec-74b2">
              See a Live Execution
              <Execution size={18} />
            </Link>
          </div>
          <div className="hero-stats hero-animate hero-delay-4">
            <span>
              <strong>14</strong> Mandates Active
            </span>
            <span>
              <strong>48,200 GEN</strong> Governed
            </span>
            <span>
              <strong>99.2%</strong> Policy Compliance
            </span>
          </div>
        </div>
        <div className="hero-proof" aria-label="Product summary">
          <ShieldCheck size={28} />
          <span>Bradbury-native AI policy verification</span>
        </div>
      </section>
      <Footer />
    </>
  )
}
