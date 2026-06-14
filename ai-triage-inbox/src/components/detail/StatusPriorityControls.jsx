import styles from './Detail.module.css'

const STATUSES = ['New', 'In Progress', 'Done']
const PRIORITIES = ['P1', 'P2', 'P3']

function Segmented({ label, options, value, onChange, name }) {
  return (
    <div className={styles.control}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.segmented} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`${styles.segment} ${value === opt ? styles.segOn : ''}`}
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StatusPriorityControls({ item, onStatus, onPriority }) {
  return (
    <div className={styles.controls}>
      <Segmented
        label="Status"
        options={STATUSES}
        value={item.status}
        onChange={onStatus}
      />
      <Segmented
        label="Priority"
        options={PRIORITIES}
        value={item.priority}
        onChange={onPriority}
      />
    </div>
  )
}
