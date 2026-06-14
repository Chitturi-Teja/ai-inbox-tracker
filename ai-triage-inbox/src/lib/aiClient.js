// AI client façade. Simulates network behaviour around the deterministic mock
// content (latency, ~12% transient failures), drives the streaming draft, and
// is fully cancellable via an AbortSignal. The same interface backs the
// optional real provider, so the rest of the app is provider-agnostic.
//
//   runAi({ item, attempt, mock, signal, onMeta, onDraftChunk })
//     -> resolves { raw, validation }   (validation may be ok:false — that's
//        a *successful* call returning bad content, surfaced via Debug mode)
//     -> rejects  Error                 (transient network failure -> Retry)
//     -> rejects  AbortError            (cancelled: switch / re-trigger / Stop)

import { generateRaw, mockLatency } from './mockAi.js'
import { validateAiResponse } from './schema.js'
import { runRealAi } from './realAi.js'

const TRANSIENT_FAILURE_RATE = 0.12

function abortError(signal) {
  const reason =
    signal && typeof signal.reason === 'string' ? signal.reason : 'aborted'
  const err = new DOMException('AI request aborted', 'AbortError')
  err.cancelReason = reason
  return err
}

// setTimeout that rejects (with AbortError) the moment the signal fires.
export function abortableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError(signal))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(abortError(signal))
      },
      { once: true },
    )
  })
}

// Replay a finished draft as an incremental stream. Emits the cumulative
// draft-so-far on each tick so the consumer can just assign it to state.
// Honours the abort signal between ticks (partial text is already emitted).
async function streamDraft(draft, signal, onDraftChunk) {
  if (!draft) return
  const tokens = draft.split(/(\s+)/) // keep whitespace tokens
  let soFar = ''
  for (let i = 0; i < tokens.length; i++) {
    soFar += tokens[i]
    const isFlush = i % 6 === 5 || i === tokens.length - 1
    if (isFlush) {
      await abortableDelay(45, signal)
      onDraftChunk(soFar)
    }
  }
}

async function runMock({ item, attempt, signal, onMeta, onDraftChunk }) {
  // 1) Network latency (cancellable).
  await abortableDelay(mockLatency(item), signal)

  // 2) Transient failure (~12% per attempt) — recoverable on Retry.
  //    Math.random is fine in app code; only the *content* must be deterministic.
  if (Math.random() < TRANSIENT_FAILURE_RATE) {
    throw new Error('Network error: could not reach the AI service (503).')
  }

  // 3) Deterministic raw output (may be intentionally malformed for some items).
  const raw = generateRaw(item)
  const validation = validateAiResponse(raw)

  // 4) Bad output -> return immediately; caller routes to Debug/error UI.
  if (!validation.ok) return { raw, validation }

  // 5) Good output -> reveal meta first, then stream the draft progressively.
  onMeta({ ...validation.value, draft_reply: '' })
  await streamDraft(validation.value.draft_reply, signal, onDraftChunk)

  return { raw, validation }
}

export async function runAi({
  item,
  attempt = 1,
  mock = true,
  signal,
  onMeta,
  onDraftChunk,
}) {
  if (mock) {
    return runMock({ item, attempt, signal, onMeta, onDraftChunk })
  }
  // Real provider path (optional). Returns the same { raw, validation } shape;
  // we replay its draft through the same streaming UX for consistency.
  const raw = await runRealAi({ item, signal })
  const validation = validateAiResponse(raw)
  if (!validation.ok) return { raw, validation }
  onMeta({ ...validation.value, draft_reply: '' })
  await streamDraft(validation.value.draft_reply, signal, onDraftChunk)
  return { raw, validation }
}
