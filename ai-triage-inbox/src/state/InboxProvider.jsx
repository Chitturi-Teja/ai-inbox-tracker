import {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import seedItems from '../data/mockItems.js'

// Single source of truth for inbox data and UI selection state, via useReducer.
// AI results deliberately live elsewhere (AiCacheProvider) so AI streaming never
// re-renders the list. Action creators are memoized once so memoized rows keep
// stable callback identities.

const InboxStateContext = createContext(null)
const InboxActionsContext = createContext(null)

function init() {
  return {
    items: seedItems,
    filters: { status: 'all', priority: 'all' },
    search: '',
    selectedIds: new Set(),
    activeItemId: null,
    notesByItem: {},
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      }

    case 'SET_SEARCH':
      return { ...state, search: action.value }

    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedIds)
      next.has(action.id) ? next.delete(action.id) : next.add(action.id)
      return { ...state, selectedIds: next }
    }

    case 'SELECT_MANY': {
      const next = new Set(state.selectedIds)
      action.ids.forEach((id) => next.add(id))
      return { ...state, selectedIds: next }
    }

    case 'CLEAR_SELECT':
      return state.selectedIds.size
        ? { ...state, selectedIds: new Set() }
        : state

    case 'BULK_MARK_DONE': {
      if (!state.selectedIds.size) return state
      const items = state.items.map((it) =>
        state.selectedIds.has(it.id) ? { ...it, status: 'Done' } : it,
      )
      return { ...state, items, selectedIds: new Set() }
    }

    case 'SET_STATUS':
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, status: action.value } : it,
        ),
      }

    case 'SET_PRIORITY':
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, priority: action.value } : it,
        ),
      }

    case 'SET_ACTIVE':
      return { ...state, activeItemId: action.id }

    case 'SET_NOTES':
      return {
        ...state,
        notesByItem: { ...state.notesByItem, [action.id]: action.value },
      }

    default:
      return state
  }
}

export function InboxProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  // Stable action creators (dispatch identity is stable across renders).
  const actions = useMemo(
    () => ({
      setFilter: (key, value) => dispatch({ type: 'SET_FILTER', key, value }),
      setSearch: (value) => dispatch({ type: 'SET_SEARCH', value }),
      toggleSelect: (id) => dispatch({ type: 'TOGGLE_SELECT', id }),
      selectMany: (ids) => dispatch({ type: 'SELECT_MANY', ids }),
      clearSelect: () => dispatch({ type: 'CLEAR_SELECT' }),
      bulkMarkDone: () => dispatch({ type: 'BULK_MARK_DONE' }),
      setStatus: (id, value) => dispatch({ type: 'SET_STATUS', id, value }),
      setPriority: (id, value) => dispatch({ type: 'SET_PRIORITY', id, value }),
      setActive: (id) => dispatch({ type: 'SET_ACTIVE', id }),
      setNotes: (id, value) => dispatch({ type: 'SET_NOTES', id, value }),
    }),
    [],
  )

  return (
    <InboxActionsContext.Provider value={actions}>
      <InboxStateContext.Provider value={state}>
        {children}
      </InboxStateContext.Provider>
    </InboxActionsContext.Provider>
  )
}

export function useInboxState() {
  const ctx = useContext(InboxStateContext)
  if (!ctx) throw new Error('useInboxState must be used within InboxProvider')
  return ctx
}

export function useInboxActions() {
  const ctx = useContext(InboxActionsContext)
  if (!ctx) throw new Error('useInboxActions must be used within InboxProvider')
  return ctx
}
