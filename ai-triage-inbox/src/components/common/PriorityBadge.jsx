import Badge from './Badge.jsx'

const LABEL = { P1: 'P1 · High', P2: 'P2 · Med', P3: 'P3 · Low' }

export default function PriorityBadge({ priority, compact = false }) {
  return (
    <Badge tone={priority?.toLowerCase()} title={LABEL[priority]}>
      {compact ? priority : LABEL[priority] || priority}
    </Badge>
  )
}
