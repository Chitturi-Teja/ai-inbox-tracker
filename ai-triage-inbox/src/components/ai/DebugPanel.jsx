import Button from '../common/Button.jsx'
import styles from './AiAssistPanel.module.css'

// Treats the AI like an unreliable dependency: shows the raw output, any schema
// validation errors, and a retry action.
export default function DebugPanel({ raw, validation, onRetry }) {
  const errors = validation?.errors || []
  return (
    <section className={styles.debug} aria-label="AI debug output">
      <div className={styles.debugHead}>
        <span className={styles.debugTitle}>🐞 Debug</span>
        <span
          className={`${styles.debugStatus} ${
            validation?.ok ? styles.debugOk : styles.debugBad
          }`}
        >
          {validation == null
            ? 'no response yet'
            : validation.ok
              ? 'schema valid'
              : `${errors.length} validation error${errors.length === 1 ? '' : 's'}`}
        </span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <ul className={styles.debugErrors}>
          {errors.map((e, i) => (
            <li key={i}>
              <code>{e.field}</code> — {e.message}
            </li>
          ))}
        </ul>
      )}

      <pre className={styles.debugRaw}>
        {raw != null ? raw : '— no raw output —'}
      </pre>
    </section>
  )
}
