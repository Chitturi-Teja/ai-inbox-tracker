import styles from './Detail.module.css'

export default function NotesField({ value, onChange }) {
  return (
    <div className={styles.notes}>
      <label className={styles.notesLabel} htmlFor="notes-field">
        Internal notes
      </label>
      <textarea
        id="notes-field"
        className={styles.notesInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a private note for this message (not sent to the customer)…"
        rows={2}
      />
    </div>
  )
}
