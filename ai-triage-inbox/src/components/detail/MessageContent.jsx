import { absoluteTime, initials } from '../../lib/format.js'
import styles from './Detail.module.css'

const CHANNEL_LABEL = { email: 'Email', chat: 'Chat' }

export default function MessageContent({ item }) {
  return (
    <article className={styles.message}>
      <div className={styles.msgHead}>
        <span className={styles.msgAvatar} aria-hidden="true">
          {initials(item.sender.name)}
        </span>
        <div className={styles.msgFrom}>
          <span className={styles.msgName}>{item.sender.name}</span>
          <span className={styles.msgEmail}>{item.sender.email}</span>
        </div>
        <div className={styles.msgMeta}>
          <span className={styles.msgChannel}>
            {CHANNEL_LABEL[item.channel] || item.channel}
          </span>
          <time dateTime={item.received_at}>{absoluteTime(item.received_at)}</time>
        </div>
      </div>

      <div className={styles.msgBody}>{item.body}</div>

      {item.tags?.length > 0 && (
        <div className={styles.tags}>
          {item.tags.map((t) => (
            <span key={t} className={styles.tag}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
