import InboxRow from './InboxRow.jsx'
import EmptyState from '../common/EmptyState.jsx'
import styles from './InboxList.module.css'

export default function InboxList({
  items,
  activeId,
  selectedIds,
  onOpen,
  onToggleSelect,
  hasAnyItems,
}) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyState
          icon={hasAnyItems ? '🔍' : '📭'}
          title={hasAnyItems ? 'No messages match your filters' : 'Inbox is empty'}
          hint={
            hasAnyItems
              ? 'Try clearing the search or changing the status/priority filters.'
              : 'New messages will appear here.'
          }
        />
      </div>
    )
  }

  return (
    <ul
      className={styles.list}
      role="listbox"
      aria-label="Inbox messages"
      tabIndex={-1}
    >
      {items.map((item) => (
        <InboxRow
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          isSelected={selectedIds.has(item.id)}
          onOpen={onOpen}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </ul>
  )
}
