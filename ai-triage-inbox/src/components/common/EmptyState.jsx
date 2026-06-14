import styles from './StateBlocks.module.css'

export default function EmptyState({ icon = '📭', title, hint, action }) {
  return (
    <div className={styles.block}>
      <div className={styles.icon} aria-hidden="true">
        {icon}
      </div>
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  )
}
