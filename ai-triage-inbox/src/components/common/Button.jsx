import styles from './Button.module.css'

// Variants: primary | secondary | ghost | danger. Sizes: md | sm.
export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
