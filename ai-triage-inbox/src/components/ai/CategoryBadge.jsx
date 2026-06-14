import Badge from '../common/Badge.jsx'

const TONE = {
  Billing: 'billing',
  Claims: 'claims',
  Endorsement: 'endorsement',
  General: 'general',
  Urgent: 'urgent',
  Spam: 'spam',
}

export default function CategoryBadge({ category }) {
  return <Badge tone={TONE[category] || 'neutral'}>{category}</Badge>
}
