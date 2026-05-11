import { AddressDisplay } from '../components/ui/AddressDisplay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Tag } from '../components/ui/Tag'
import { useAppContext } from '../context/AppContext'
import { currency, readableDate } from '../utils/format'

export function Vault() {
  const { state, notify } = useAppContext()
  const { vault } = state

  return (
    <section className="page">
      <div className="vault-hero">
        <div>
          <p className="eyebrow">Vault</p>
          <h1>${currency(vault.balance)} USDC</h1>
          <p>Escrow balance governed by mandate verdicts and settlement intents.</p>
        </div>
        <div className="topbar-actions">
          <Button variant="secondary" onClick={() => notify({ tone: 'info', title: 'Deposit flow', message: 'Vault deposit wiring comes with EVM escrow integration.' })}>
            Deposit
          </Button>
          <Button variant="danger" onClick={() => notify({ tone: 'warning', title: 'Withdrawal guarded', message: 'Withdrawals require operator policy checks.' })}>
            Withdraw
          </Button>
        </div>
      </div>

      <div className="vault-grid">
        <Card className="panel">
          <div className="panel-heading">
            <span className="eyebrow">Transaction History</span>
          </div>
          <div className="transaction-table">
            {vault.transactions.map((tx) => (
              <div className="transaction-row" key={tx.id}>
                <Tag variant={tx.type === 'Release' ? 'success' : tx.type === 'Hold' ? 'warning' : 'default'}>{tx.type}</Tag>
                <strong>${currency(tx.amount)}</strong>
                <AddressDisplay address={tx.counterparty} />
                <AddressDisplay address={tx.txHash} />
                <span>{readableDate(tx.time)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="panel">
          <div className="panel-heading">
            <span className="eyebrow">Vault Metadata</span>
          </div>
          <div className="meta-list">
            <span>
              <strong>Vault address</strong>
              <AddressDisplay address={vault.address} full />
            </span>
            <span>
              <strong>Network</strong>
              <Tag variant="lilac">{vault.network}</Tag>
            </span>
            <span>
              <strong>Escrow contract</strong>
              <AddressDisplay address={vault.escrowContract} />
            </span>
            <span>
              <strong>Created</strong>
              May 2026
            </span>
            <span>
              <strong>Mandates</strong>
              {state.mandates.length}
            </span>
          </div>
          <div className="agent-list">
            {vault.authorizedAgents.map((agent) => (
              <AddressDisplay key={agent} address={agent} />
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
