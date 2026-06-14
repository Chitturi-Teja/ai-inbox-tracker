import { useEffect, useMemo, useRef } from 'react'
import { SettingsProvider, useSettings } from './state/SettingsProvider.jsx'
import {
  InboxProvider,
  useInboxState,
  useInboxActions,
} from './state/InboxProvider.jsx'
import { AiCacheProvider } from './state/AiCacheProvider.jsx'
import { useDebouncedValue } from './hooks/useDebouncedValue.js'
import { useKeyboardNav } from './hooks/useKeyboardNav.js'
import SearchBar from './components/inbox/SearchBar.jsx'
import FilterBar from './components/inbox/FilterBar.jsx'
import BulkActionsBar from './components/inbox/BulkActionsBar.jsx'
import InboxList from './components/inbox/InboxList.jsx'
import DetailView from './components/detail/DetailView.jsx'
import EmptyState from './components/common/EmptyState.jsx'
import styles from './App.module.css'

function Topbar() {
  const { mockMode, debugMode, realAiAvailable, toggleMockMode, toggleDebugMode } =
    useSettings()
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          ✨
        </span>
        <span className={styles.brandName}>AI Triage Inbox</span>
      </div>

      <div className={styles.topActions}>
        <span className={styles.kbdHint}>
          <kbd>j</kbd>/<kbd>k</kbd> move · <kbd>↵</kbd> open · <kbd>x</kbd> select ·{' '}
          <kbd>e</kbd> done · <kbd>/</kbd> search
        </span>

        <label
          className={`${styles.toggle} ${
            !realAiAvailable ? styles.toggleDisabled : ''
          }`}
          title={
            realAiAvailable
              ? 'Switch between deterministic Mock AI and the configured real provider'
              : 'Real AI not configured — add VITE_ANTHROPIC_API_KEY to .env.local'
          }
        >
          <input
            type="checkbox"
            checked={!mockMode}
            disabled={!realAiAvailable}
            onChange={toggleMockMode}
          />
          <span>{mockMode ? 'Mock AI' : 'Real AI'}</span>
        </label>

        <label className={styles.toggle} title="Show raw AI output + validation">
          <input type="checkbox" checked={debugMode} onChange={toggleDebugMode} />
          <span>Debug</span>
        </label>
      </div>
    </header>
  )
}

function Workspace() {
  const state = useInboxState()
  const actions = useInboxActions()
  const searchRef = useRef(null)

  const debouncedSearch = useDebouncedValue(state.search, 180)

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return state.items.filter((it) => {
      if (state.filters.status !== 'all' && it.status !== state.filters.status)
        return false
      if (
        state.filters.priority !== 'all' &&
        it.priority !== state.filters.priority
      )
        return false
      if (q) {
        const hay =
          `${it.sender.name} ${it.sender.email} ${it.subject} ${it.body}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [state.items, state.filters.status, state.filters.priority, debouncedSearch])

  const activeItem = useMemo(
    () => state.items.find((it) => it.id === state.activeItemId) || null,
    [state.items, state.activeItemId],
  )

  // Keyboard fast-triage over the currently visible list.
  useKeyboardNav({
    items: filtered,
    activeId: state.activeItemId,
    onMove: actions.setActive,
    onOpen: actions.setActive,
    onToggleSelect: actions.toggleSelect,
    onMarkDone: (id) => actions.setStatus(id, 'Done'),
    onFocusSearch: () => searchRef.current?.focus(),
  })

  // Keep the focused row in view during keyboard navigation.
  useEffect(() => {
    if (!state.activeItemId) return
    const el = document.getElementById(`inbox-row-${state.activeItemId}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [state.activeItemId])

  const onFilterChange = (key, value) => actions.setFilter(key, value)

  return (
    <div
      className={`${styles.workspace} ${
        activeItem ? styles.hasActive : ''
      }`}
    >
      <section className={styles.listPane} aria-label="Inbox">
        <SearchBar
          value={state.search}
          onChange={actions.setSearch}
          inputRef={searchRef}
        />
        <FilterBar
          filters={state.filters}
          onChange={onFilterChange}
          count={filtered.length}
        />
        <BulkActionsBar
          count={state.selectedIds.size}
          onMarkDone={actions.bulkMarkDone}
          onClear={actions.clearSelect}
        />
        <InboxList
          items={filtered}
          activeId={state.activeItemId}
          selectedIds={state.selectedIds}
          onOpen={actions.setActive}
          onToggleSelect={actions.toggleSelect}
          hasAnyItems={state.items.length > 0}
        />
      </section>

      <section className={styles.detailPane} aria-label="Message detail">
        {activeItem ? (
          <DetailView
            item={activeItem}
            notes={state.notesByItem[activeItem.id] || ''}
            onBack={() => actions.setActive(null)}
            onStatus={(value) => actions.setStatus(activeItem.id, value)}
            onPriority={(value) => actions.setPriority(activeItem.id, value)}
            onNotes={(value) => actions.setNotes(activeItem.id, value)}
          />
        ) : (
          <div className={styles.placeholder}>
            <EmptyState
              icon="👈"
              title="Select a message to triage"
              hint="Pick a message from the inbox, or use j/k and Enter to move fast. AI suggestions load automatically."
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <InboxProvider>
        <AiCacheProvider>
          <div className={styles.app}>
            <Topbar />
            <Workspace />
          </div>
        </AiCacheProvider>
      </InboxProvider>
    </SettingsProvider>
  )
}
