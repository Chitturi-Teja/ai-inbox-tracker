import styles from './AiAssistPanel.module.css'

export default function SummaryBullets({ bullets }) {
  return (
    <ul className={styles.bullets}>
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  )
}
