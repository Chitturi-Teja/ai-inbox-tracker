import styles from './StateBlocks.module.css'
import Button from './Button.jsx'

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className={`${styles.block} ${styles.error}`} role="alert">
      <div className={styles.icon} aria-hidden="true">
        ⚠️
      </div>
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.hint}>{message}</p>}
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
