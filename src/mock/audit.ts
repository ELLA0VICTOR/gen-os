import type { AuditEvent } from './types'

const actors = [
  '0x28E7C6DFe94c9F11aD05A8C35B49e091B2d73051',
  '0x8A340271fE75c6bAB65A36d6625Ff9A432fF8421',
  '0x91b24Fd3Aeb93352c82dB70C4900f74C3eCe012a',
  '0xB17Bd8E81370dd19aF4bE4c339d2012d9B544fB2',
]

const actions = ['MANDATE_CREATED', 'EXECUTION_SUBMITTED', 'EVIDENCE_FETCHED', 'GENLAYER_VERDICT', 'PAYMENT_RELEASED']
const results: AuditEvent['result'][] = ['created', 'pending', 'approved', 'rejected', 'released']

export const auditEvents: AuditEvent[] = Array.from({ length: 54 }, (_, index) => {
  const hour = String(23 - (index % 20)).padStart(2, '0')
  const minute = String((index * 7) % 60).padStart(2, '0')

  return {
    id: `audit-${index + 1}`,
    timestamp: `2026-05-${String(11 - Math.floor(index / 18)).padStart(2, '0')}T${hour}:${minute}:00Z`,
    actor: actors[index % actors.length],
    action: actions[index % actions.length],
    target: index % 3 === 0 ? `mandate-00${(index % 5) + 1}` : `exec-${(index * 47).toString(16).slice(0, 4)}`,
    result: results[index % results.length],
  }
})
