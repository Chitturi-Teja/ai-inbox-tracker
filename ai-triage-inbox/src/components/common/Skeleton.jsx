import styles from './Skeleton.module.css'

// A shimmering placeholder line/block. `w` and `h` accept any CSS size.
export default function Skeleton({ w = '100%', h = 12, radius = 6, style }) {
  return (
    <span
      className={styles.skeleton}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}
