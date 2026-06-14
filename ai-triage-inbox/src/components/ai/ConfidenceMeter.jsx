import styles from './AiAssistPanel.module.css'

export default function ConfidenceMeter({ value = 0 }) {
  const pct = Math.round(value * 100)
  const tone = pct >= 80 ? 'high' : pct >= 60 ? 'mid' : 'low'
  return (
    <div className={styles.confidence} title={`Model confidence: ${pct}%`}>
      <span className={styles.confidenceLabel}>Confidence</span>
      <span className={styles.confidenceTrack}>
        <span
          className={`${styles.confidenceFill} ${styles[`conf_${tone}`]}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={styles.confidencePct}>{pct}%</span>
    </div>
  )
}
