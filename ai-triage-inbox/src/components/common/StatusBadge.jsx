import Badge from './Badge.jsx'

const TONE = { New: 'new', 'In Progress': 'progress', Done: 'done' }

export default function StatusBadge({ status }) {
  return (
    <Badge tone={TONE[status] || 'neutral'} dot>
      {status}
    </Badge>
  )
}
