// Formatting helpers — pure functions, no side effects.

// "Now" is fixed to the dataset's era so relative times read sensibly in a
// demo whose data is dated. Falls back to the real clock if needed.
const DEMO_NOW = new Date('2026-03-16T14:00:00+07:00').getTime()

export function relativeTime(iso, now = DEMO_NOW) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, now - then)
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(then).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function absoluteTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function initials(name = '') {
  const cleaned = name.replace(/[^\p{L}\p{N} ]/gu, '').trim()
  if (!cleaned) return '?'
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function truncate(text = '', max = 140) {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t
}
