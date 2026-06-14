import Button from '../common/Button.jsx'
import styles from './Toolbar.module.css'

export default function BulkActionsBar({ count, onMarkDone, onClear }) {
  if (count === 0) return null
  return (
    <div className={styles.bulk} role="region" aria-label="Bulk actions">
      <span className={styles.bulkCount}>{count} selected</span>
      <div className={styles.bulkActions}>
        <Button variant="primary" size="sm" onClick={onMarkDone}>
          Mark Done
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  )
}
