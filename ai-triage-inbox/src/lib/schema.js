// Runtime validator for the AI output contract. Hand-rolled (no zod) so the
// "treat AI like an unreliable dependency" intent is explicit and inspectable.
//
// Contract:
// {
//   summary_bullets: string[]  (2-4 non-empty)
//   category: "Billing"|"Claims"|"Endorsement"|"General"|"Urgent"|"Spam"
//   priority: "P1"|"P2"|"P3"
//   suggested_action: string (non-empty)
//   draft_reply: string
//   confidence: number (0..1)
// }

export const CATEGORIES = [
  'Billing',
  'Claims',
  'Endorsement',
  'General',
  'Urgent',
  'Spam',
]
export const PRIORITIES = ['P1', 'P2', 'P3']

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

// Validate an already-parsed object. Returns { ok, value, errors:[{field,message}] }.
export function validateAiObject(obj) {
  const errors = []

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return {
      ok: false,
      value: null,
      errors: [{ field: '(root)', message: 'Response is not a JSON object' }],
    }
  }

  // summary_bullets
  const bullets = obj.summary_bullets
  if (!Array.isArray(bullets)) {
    errors.push({ field: 'summary_bullets', message: 'Expected an array' })
  } else {
    if (bullets.length < 2 || bullets.length > 4) {
      errors.push({
        field: 'summary_bullets',
        message: `Expected 2–4 bullets, got ${bullets.length}`,
      })
    }
    if (!bullets.every(isNonEmptyString)) {
      errors.push({
        field: 'summary_bullets',
        message: 'All bullets must be non-empty strings',
      })
    }
  }

  // category
  if (!CATEGORIES.includes(obj.category)) {
    errors.push({
      field: 'category',
      message: `Expected one of ${CATEGORIES.join(', ')}; got ${JSON.stringify(
        obj.category,
      )}`,
    })
  }

  // priority
  if (!PRIORITIES.includes(obj.priority)) {
    errors.push({
      field: 'priority',
      message: `Expected one of ${PRIORITIES.join(', ')}; got ${JSON.stringify(
        obj.priority,
      )}`,
    })
  }

  // suggested_action
  if (!isNonEmptyString(obj.suggested_action)) {
    errors.push({
      field: 'suggested_action',
      message: 'Expected a non-empty string',
    })
  }

  // draft_reply
  if (typeof obj.draft_reply !== 'string') {
    errors.push({ field: 'draft_reply', message: 'Expected a string' })
  }

  // confidence
  if (
    typeof obj.confidence !== 'number' ||
    Number.isNaN(obj.confidence) ||
    obj.confidence < 0 ||
    obj.confidence > 1
  ) {
    errors.push({
      field: 'confidence',
      message: 'Expected a number between 0 and 1',
    })
  }

  return { ok: errors.length === 0, value: errors.length ? null : obj, errors }
}

// Validate a raw string (as a model would emit). Handles parse failure.
export function validateAiResponse(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    return {
      ok: false,
      value: null,
      errors: [{ field: '(parse)', message: `Invalid JSON: ${err.message}` }],
    }
  }
  return validateAiObject(parsed)
}
