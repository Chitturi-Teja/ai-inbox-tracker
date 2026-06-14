import styles from './Toolbar.module.css'

const STATUSES = ['all', 'New', 'In Progress', 'Done']
const PRIORITIES = ['all', 'P1', 'P2', 'P3']

export default function FilterBar({ filters, onChange, count }) {
  return (
    <div className={styles.filters}>
      <label className={styles.selectWrap}>
        <span className={styles.selectLabel}>Status</span>
        <select
          value={filters.status}
          onChange={(e) => onChange('status', e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All' : s}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.selectWrap}>
        <span className={styles.selectLabel}>Priority</span>
        <select
          value={filters.priority}
          onChange={(e) => onChange('priority', e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? 'All' : p}
            </option>
          ))}
        </select>
      </label>

      <span className={styles.count}>
        {count} {count === 1 ? 'message' : 'messages'}
      </span>
    </div>
  )
}
