import styles from './Toolbar.module.css'

export default function SearchBar({ value, onChange, inputRef }) {
  return (
    <div className={styles.search}>
      <span className={styles.searchIcon} aria-hidden="true">
        🔍
      </span>
      <input
        ref={inputRef}
        type="search"
        className={styles.searchInput}
        placeholder="Search sender, subject or body…  ( / )"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search messages"
      />
    </div>
  )
}
