// Deterministic Mock AI content engine.
//
// Pure & deterministic: the same item ALWAYS produces the same raw output
// (no Math.random here — seeded from the item id). Network behaviour (latency,
// transient failures) and streaming timing live in aiClient.js, not here, so
// content stays reproducible.
//
// To exercise the schema validator + Debug mode, a couple of items are flagged
// to emit deliberately *broken* output (malformed JSON or an out-of-enum value).

import { hashString, mulberry32 } from './hash.js'

// Bump when the generation logic changes — part of the per-item cache key so
// cached results are invalidated correctly.
export const PROMPT_VERSION = 'v1'

// Items whose generated output is intentionally broken, to test robustness.
//   'truncated-json' -> raw is not parseable JSON  (parse error path)
//   'bad-enum'       -> parses fine but category is out of the enum (schema error path)
const BROKEN_OUTPUT = {
  itm_009: 'truncated-json',
  itm_020: 'bad-enum',
}

const INJECTION_MARKERS = [
  'ignore previous instructions',
  'send your internal',
  'access token',
  'confirm your password',
  'your otp',
  'verify your account',
  'avoid suspension',
]

const SPAM_DOMAINS = ['.biz', '.win', 'prize-draw', 'cheap-insure', 'feedback-loop']

function firstName(rawName) {
  const cleaned = (rawName || '').replace(/[^\p{L} ]/gu, '').trim()
  const tok = cleaned.split(/\s+/)[0]
  // Guard against junk "names" like "WIN A FREE iPhone" or empty.
  if (!tok || tok.length < 2 || tok === tok.toUpperCase()) return 'there'
  return tok
}

function extractFacts(item) {
  const text = item.body || ''
  return {
    policy: (text.match(/TH-MTR-\d+/) || [])[0] || null,
    claim: (text.match(/CLM-\d+/) || [])[0] || null,
    amount: (text.match(/[\d,]+\s?THB/) || [])[0] || null,
  }
}

function looksLikeSpam(item) {
  const blob = `${item.subject} ${item.body}`.toLowerCase()
  if (item.tags?.includes('spam')) return true
  if (INJECTION_MARKERS.some((m) => blob.includes(m))) return true
  const email = (item.sender?.email || '').toLowerCase()
  if (SPAM_DOMAINS.some((d) => email.includes(d))) return true
  return false
}

function classify(item) {
  const t = item.tags || []
  if (looksLikeSpam(item)) return 'Spam'
  if (t.includes('complaint') || t.includes('urgent')) return 'Urgent'
  if (t.includes('claims')) return 'Claims'
  if (
    t.includes('billing') ||
    t.includes('payment') ||
    t.includes('pricing') ||
    t.includes('renewal') ||
    t.includes('cancellation')
  )
    return 'Billing'
  if (t.includes('endorsement')) return 'Endorsement'
  return 'General'
}

function derivePriority(item, category) {
  const t = item.tags || []
  if (category === 'Spam') return 'P3'
  if (category === 'Urgent') return 'P1'
  if (
    t.includes('escalation') ||
    t.includes('dispute') ||
    t.includes('total-loss') ||
    t.includes('first-notice')
  )
    return 'P1'
  if (category === 'Claims' || category === 'Billing') return 'P2'
  return 'P3'
}

function buildSummary(item, category, facts, rnd) {
  const name = item.sender?.name || 'Sender'
  const multi = item.tags?.includes('multi-topic')
  const bullets = []

  switch (category) {
    case 'Spam':
      bullets.push(
        `Message from ${item.sender?.email || 'unknown sender'} shows phishing/spam hallmarks.`,
      )
      bullets.push(
        'Contains pressure tactics and/or a request for credentials — do not action.',
      )
      bullets.push('No legitimate customer request identified.')
      break
    case 'Claims':
      bullets.push(`${name} is raising a claims matter${facts.claim ? ` (${facts.claim})` : ''}.`)
      if (facts.policy) bullets.push(`Policy referenced: ${facts.policy}.`)
      bullets.push('Customer is waiting on next steps and may be without a vehicle.')
      break
    case 'Billing':
      bullets.push(`${name} has a billing/pricing concern${facts.amount ? ` (${facts.amount})` : ''}.`)
      if (facts.policy) bullets.push(`Policy referenced: ${facts.policy}.`)
      if (multi) bullets.push('Note: message contains a second, separate request.')
      else bullets.push('Wants the charge reviewed and corrected if wrong.')
      break
    case 'Endorsement':
      bullets.push(`${name} requests a policy endorsement (change of details).`)
      if (facts.policy) bullets.push(`Policy referenced: ${facts.policy}.`)
      bullets.push('Confirm required documents and effective date before applying.')
      break
    case 'Urgent':
      bullets.push(`${name} is frustrated and the issue is time-sensitive.`)
      if (facts.amount) bullets.push(`Amount in dispute: ${facts.amount}.`)
      if (facts.policy) bullets.push(`Policy referenced: ${facts.policy}.`)
      bullets.push('Risk of escalation/complaint if not resolved promptly.')
      break
    default:
      bullets.push(`${name} has a general enquiry.`)
      bullets.push('No account action required yet — an informational reply is enough.')
      if (facts.policy) bullets.push(`Policy referenced: ${facts.policy}.`)
  }

  // Deterministically keep 2–4 bullets (most have 3). Drop one sometimes via seed.
  const trimmed = bullets.filter(Boolean)
  if (trimmed.length > 3 && rnd() < 0.5) trimmed.pop()
  return trimmed.slice(0, 4)
}

function buildAction(category) {
  switch (category) {
    case 'Spam':
      return 'Mark as spam and do not engage; flag the sender domain.'
    case 'Claims':
      return 'Pull up the claim, confirm documents received, and send the next-step timeline.'
    case 'Billing':
      return 'Review the charge against the billing record and issue a correction/refund if warranted.'
    case 'Endorsement':
      return 'Request the supporting documents, then apply the endorsement with the stated effective date.'
    case 'Urgent':
      return 'Acknowledge within the hour, investigate the root cause, and give a firm resolution time.'
    default:
      return 'Send a concise informational reply answering the question directly.'
  }
}

function buildDraft(item, category, facts) {
  const greet = firstName(item.sender?.name)
  const sign = '\n\nBest regards,\nSupport Team'

  switch (category) {
    case 'Spam':
      // Nothing to send — this is for ops review, not the customer.
      return ''
    case 'Claims':
      return `Hi ${greet},\n\nThanks for reaching out about your claim${
        facts.claim ? ` (${facts.claim})` : ''
      }. I'm sorry for the stress this is causing. I can see the details${
        facts.policy ? ` on policy ${facts.policy}` : ''
      } and I'm escalating it for review now. I'll come back to you with the next steps and an expected timeline as soon as possible — and sooner if anything is needed from you.${sign}`
    case 'Billing':
      return `Hi ${greet},\n\nThanks for flagging this${
        facts.amount ? ` regarding the ${facts.amount} charge` : ''
      }. I'm reviewing your billing record${
        facts.policy ? ` for policy ${facts.policy}` : ''
      } now. If we find a discrepancy I'll arrange a correction or refund right away and confirm the amount and timing with you.${sign}`
    case 'Endorsement':
      return `Hi ${greet},\n\nHappy to help with this change${
        facts.policy ? ` on policy ${facts.policy}` : ''
      }. To process the endorsement I'll just need to confirm a couple of details and the effective date. I'll apply it as soon as that's confirmed and send you an updated schedule.${sign}`
    case 'Urgent':
      return `Hi ${greet},\n\nI'm really sorry about this and I understand the frustration. I'm treating it as a priority and looking into it personally right now${
        facts.policy ? ` (policy ${facts.policy})` : ''
      }. I'll get back to you today with a clear update and a resolution${
        facts.amount ? `, including the ${facts.amount}` : ''
      }.${sign}`
    default:
      return `Hi ${greet},\n\nThanks for your question — happy to help. [Add the specific answer here.] Let me know if anything's unclear and I'll be glad to clarify.${sign}`
  }
}

// Build the structured result object for an item (deterministic).
export function buildResult(item) {
  const seed = hashString(item.id)
  const rnd = mulberry32(seed)
  const category = classify(item)
  const facts = extractFacts(item)
  const priority = derivePriority(item, category)

  let confidence
  if (category === 'Spam') confidence = 0.9 + rnd() * 0.09
  else if (category === 'General') confidence = 0.6 + rnd() * 0.2
  else confidence = 0.72 + rnd() * 0.22
  confidence = Math.round(confidence * 100) / 100

  return {
    summary_bullets: buildSummary(item, category, facts, rnd),
    category,
    priority,
    suggested_action: buildAction(category),
    draft_reply: buildDraft(item, category, facts),
    confidence,
  }
}

// Produce the RAW string a model would emit. May be intentionally broken for
// flagged items so the validator + Debug mode have something to catch.
export function generateRaw(item) {
  const result = buildResult(item)
  const broken = BROKEN_OUTPUT[item.id]

  if (broken === 'bad-enum') {
    return JSON.stringify({ ...result, category: 'Question' }, null, 2)
  }

  const json = JSON.stringify(result, null, 2)

  if (broken === 'truncated-json') {
    // Cut the JSON off mid-structure — unparseable.
    return json.slice(0, Math.floor(json.length * 0.6))
  }

  return json
}

// Deterministic latency in [200, 1200] ms, derived from the item id.
export function mockLatency(item) {
  const rnd = mulberry32(hashString(item.id) ^ 0x9e3779b9)
  return Math.round(200 + rnd() * 1000)
}
