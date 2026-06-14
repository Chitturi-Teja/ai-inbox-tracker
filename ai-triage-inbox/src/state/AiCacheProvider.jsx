import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
} from 'react'

// Per-item AI cache, implemented as a tiny external store so that:
//   - the hook can read/write the latest entry SYNCHRONOUSLY (race guards), and
//   - only the components subscribed to a given item's entry re-render on change
//     (no re-render storm across the inbox while a draft streams).
//
// Cache key = `${itemId}@${promptVersion}` (built by the hook). Entry shape:
//   { status, meta, draft, raw, validation, error, attempt }
// status: 'idle'|'loading'|'streaming'|'success'|'invalid'|'error'|'stopped'

export const DEFAULT_ENTRY = Object.freeze({
  status: 'idle',
  meta: null, // { summary_bullets, category, priority, suggested_action, confidence }
  draft: '', // the AI's suggested draft (streamed); never the user's edited text
  raw: null, // raw model output string (for Debug mode)
  validation: null, // { ok, errors }
  error: null, // network/transport error message
  attempt: 0,
})

function createStore() {
  const map = new Map()
  const listeners = new Set()
  const emit = () => listeners.forEach((l) => l())

  return {
    getEntry(key) {
      return map.get(key) || DEFAULT_ENTRY
    },
    setEntry(key, patch) {
      const prev = map.get(key) || DEFAULT_ENTRY
      const next =
        typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      map.set(key, next)
      emit()
    },
    reset(key) {
      if (map.delete(key)) emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

const AiStoreContext = createContext(null)

export function AiCacheProvider({ children }) {
  const storeRef = useRef(null)
  if (!storeRef.current) storeRef.current = createStore()
  return (
    <AiStoreContext.Provider value={storeRef.current}>
      {children}
    </AiStoreContext.Provider>
  )
}

// Imperative handle for the hook (read latest, write, reset).
export function useAiStore() {
  const store = useContext(AiStoreContext)
  if (!store) throw new Error('useAiStore must be used within AiCacheProvider')
  return store
}

// Reactive subscription to a single cache entry — re-renders only this consumer.
export function useAiEntry(key) {
  const store = useAiStore()
  return useSyncExternalStore(
    store.subscribe,
    () => store.getEntry(key),
    () => DEFAULT_ENTRY,
  )
}
