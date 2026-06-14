import styles from './Badge.module.css'

// Generic pill. `tone` selects a color scheme; `dot` shows a leading status dot.
export default function Badge({ tone = 'neutral', dot = false, children, title }) {
  return (
    <span className={`${styles.badge} ${styles[tone] || ''}`} title={title}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
