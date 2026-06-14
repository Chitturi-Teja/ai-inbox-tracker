import { memo } from 'react'
import StatusBadge from '../common/StatusBadge.jsx'
import PriorityBadge from '../common/PriorityBadge.jsx'
import { initials, relativeTime, truncate } from '../../lib/format.js'
import styles from './InboxRow.module.css'

const CHANNEL_ICON = { email: '✉️', chat: '💬' }

function InboxRow({ item, isActive, isSelected, onOpen, onToggleSelect }) {
  return (
    <li id={`inbox-row-${item.id}`} role="option" aria-selected={isActive}>
      <div
        className={`${styles.row} ${isActive ? styles.active : ''} ${
          isSelected ? styles.selected : ''
        }`}
        onClick={() => onOpen(item.id)}
      >
        <label
          className={styles.checkWrap}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            aria-label={`Select message from ${item.sender.name}`}
          />
        </label>

        <span className={styles.avatar} aria-hidden="true">
          {initials(item.sender.name)}
        </span>

        <div className={styles.main}>
          <div className={styles.line1}>
            <span className={styles.sender}>{item.sender.name}</span>
            <span className={styles.time}>{relativeTime(item.received_at)}</span>
          </div>
          <div className={styles.subject}>
            <span className={styles.channel} aria-hidden="true">
              {CHANNEL_ICON[item.channel] || '•'}
            </span>
            {item.subject}
          </div>
          <div className={styles.snippet}>{truncate(item.body, 90)}</div>
          <div className={styles.badges}>
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} compact />
          </div>
        </div>
      </div>
    </li>
  )
}

// Memoized: re-renders only when this row's own props change. Combined with
// stable action creators and a stable item reference, AI streaming in the
// detail pane never re-renders the list.
export default memo(InboxRow)
