const labels = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

type RiskMeterProps = {
  level: number
  compact?: boolean
}

export function RiskMeter({ level, compact = false }: RiskMeterProps) {
  const safeLevel = Math.max(0, Math.min(4, level))

  return (
    <div className={`risk-meter ${compact ? 'risk-meter-compact' : ''}`}>
      <div className="risk-segments" aria-label={`Risk level ${safeLevel}`}>
        {[0, 1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={`risk-segment risk-segment-${segment} ${segment <= safeLevel ? 'is-filled' : ''}`}
          />
        ))}
      </div>
      <span className={`risk-label risk-label-${safeLevel}`}>{labels[safeLevel]}</span>
    </div>
  )
}
