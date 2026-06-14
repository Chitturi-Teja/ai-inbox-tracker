import MessageContent from './MessageContent.jsx'
import StatusPriorityControls from './StatusPriorityControls.jsx'
import NotesField from './NotesField.jsx'
import AiAssistPanel from '../ai/AiAssistPanel.jsx'
import styles from './Detail.module.css'

export default function DetailView({
  item,
  notes,
  onBack,
  onStatus,
  onPriority,
  onNotes,
}) {
  return (
    <div className={styles.detail}>
      <header className={styles.detailHead}>
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          aria-label="Back to inbox"
        >
          ← Inbox
        </button>
        <h2 className={styles.subject}>{item.subject}</h2>
      </header>

      <div className={styles.scroll}>
        <StatusPriorityControls
          item={item}
          onStatus={onStatus}
          onPriority={onPriority}
        />

        <MessageContent item={item} />

        <NotesField value={notes} onChange={onNotes} />

        <AiAssistPanel item={item} />
      </div>
    </div>
  )
}
