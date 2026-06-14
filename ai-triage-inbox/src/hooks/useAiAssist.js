import { useCallback, useEffect, useRef } from 'react'
import { runAi } from '../lib/aiClient.js'
import { PROMPT_VERSION } from '../lib/mockAi.js'
import { useSettings } from '../state/SettingsProvider.jsx'
import { useAiStore, useAiEntry } from '../state/AiCacheProvider.jsx'

export function cacheKey(itemId) {
  return `${itemId}@${PROMPT_VERSION}`
}

// Core AI-assist controller for the active item. Guarantees:
//  - Per-item caching (auto-generate once; reopening serves cache).
//  - Cancellation of in-flight work on item switch / Stop / re-trigger.
//  - Race safety: a late response can never land in the wrong item, and a
//    superseded request for the same item can never clobber a newer one.
//  - Streaming draft with Stop (keeps partial) and Retry.
export function useAiAssist(item) {
  const { mockMode } = useSettings()
  const store = useAiStore()

  const key = item ? cacheKey(item.id) : null
  const entry = useAiEntry(key)

  // Imperative refs that must reflect the latest values without re-subscribing.
  const controllerRef = useRef(null)
  const requestSeq = useRef(0) // monotonic id of the most recent request
  const mockRef = useRef(mockMode)
  mockRef.current = mockMode

  const abortCurrent = useCallback((reason) => {
    if (controllerRef.current) {
      controllerRef.current.abort(reason)
      controllerRef.current = null
    }
  }, [])

  const generate = useCallback(
    (attempt) => {
      if (!item) return
      const myKey = cacheKey(item.id)
      const myItemId = item.id

      // Supersede any in-flight request (same or different item).
      abortCurrent('retrigger')
      const controller = new AbortController()
      controllerRef.current = controller
      const myId = ++requestSeq.current

      // A late callback is only allowed to write if it's still the newest
      // request. Writes always target myKey, so they can't leak across items.
      const isCurrent = () => myId === requestSeq.current

      // Start: clear stale draft, keep prior meta (nicer regenerate UX).
      store.setEntry(myKey, (prev) => ({
        ...prev,
        status: 'loading',
        draft: '',
        error: null,
        raw: null,
        validation: null,
        attempt,
      }))

      runAi({
        item,
        attempt,
        mock: mockRef.current,
        signal: controller.signal,
        onMeta: (meta) => {
          if (!isCurrent()) return
          store.setEntry(myKey, (prev) => ({
            ...prev,
            status: 'streaming',
            meta: {
              summary_bullets: meta.summary_bullets,
              category: meta.category,
              priority: meta.priority,
              suggested_action: meta.suggested_action,
              confidence: meta.confidence,
            },
            draft: '',
          }))
        },
        onDraftChunk: (soFar) => {
          if (!isCurrent()) return
          store.setEntry(myKey, (prev) => ({ ...prev, draft: soFar }))
        },
      })
        .then(({ raw, validation }) => {
          if (!isCurrent()) return
          if (validation.ok) {
            store.setEntry(myKey, (prev) => ({
              ...prev,
              status: 'success',
              meta: {
                summary_bullets: validation.value.summary_bullets,
                category: validation.value.category,
                priority: validation.value.priority,
                suggested_action: validation.value.suggested_action,
                confidence: validation.value.confidence,
              },
              draft: validation.value.draft_reply,
              raw,
              validation,
              error: null,
            }))
          } else {
            // Successful call, bad content -> route to Debug/validation UI.
            store.setEntry(myKey, (prev) => ({
              ...prev,
              status: 'invalid',
              meta: null,
              draft: '',
              raw,
              validation,
              error: null,
            }))
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError') {
            // Stop: keep whatever partial draft/meta we have, for THIS item only.
            if (err.cancelReason === 'stop' && myItemId === item.id && isCurrent()) {
              store.setEntry(myKey, (prev) => ({ ...prev, status: 'stopped' }))
            }
            // 'switch' / 'retrigger': a newer owner exists — do not touch state.
            return
          }
          if (!isCurrent()) return
          store.setEntry(myKey, (prev) => ({
            ...prev,
            status: 'error',
            error: err?.message || 'Unknown error',
          }))
        })
        .finally(() => {
          // Mark "no longer in flight" — but only if a newer request hasn't
          // already taken ownership of the controller ref.
          if (controllerRef.current === controller) controllerRef.current = null
        })
    },
    [item, store, abortCurrent],
  )

  // Keep a stable ref to the latest generate for the item-change effect.
  const generateRef = useRef(generate)
  generateRef.current = generate

  // On item change: auto-generate when there's no cached result and nothing is
  // in flight. The "no controller" guard (not "status === idle") is what makes
  // this correct under React StrictMode's mount→cleanup→mount double-invoke:
  // after the first run is aborted by cleanup, the remount still re-generates.
  useEffect(() => {
    if (!item) return undefined
    const existing = store.getEntry(cacheKey(item.id))
    const TERMINAL = ['success', 'invalid', 'error', 'stopped']
    const hasResult = TERMINAL.includes(existing.status)
    if (!hasResult && !controllerRef.current) {
      generateRef.current(1)
    }
    return () => abortCurrent('switch')
  }, [item?.id, store, abortCurrent])

  const regenerate = useCallback(() => {
    generateRef.current((entry.attempt || 0) + 1)
  }, [entry.attempt])

  const retry = useCallback(() => {
    generateRef.current((entry.attempt || 0) + 1)
  }, [entry.attempt])

  const stop = useCallback(() => abortCurrent('stop'), [abortCurrent])

  return {
    entry,
    regenerate,
    retry,
    stop,
    isBusy: entry.status === 'loading' || entry.status === 'streaming',
  }
}
