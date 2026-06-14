import { useEffect, useRef } from 'react'

// Fast-triage keyboard navigation for the inbox list.
//   j / ArrowDown : move cursor down        k / ArrowUp : move cursor up
//   Enter         : open the focused item   x           : toggle select
//   e             : mark focused item Done   /          : focus search
// Keys are ignored while typing in an input/textarea/select.
export function useKeyboardNav({
  items,
  activeId,
  enabled = true,
  onMove,
  onOpen,
  onToggleSelect,
  onMarkDone,
  onFocusSearch,
}) {
  // Mirror live values into refs so the single listener always sees the latest.
  const ref = useRef({})
  ref.current = {
    items,
    activeId,
    onMove,
    onOpen,
    onToggleSelect,
    onMarkDone,
    onFocusSearch,
  }

  useEffect(() => {
    if (!enabled) return undefined

    function isTypingTarget(el) {
      if (!el) return false
      const tag = el.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      )
    }

    function onKeyDown(e) {
      const s = ref.current
      // "/" focuses search even from elsewhere, but not while already typing.
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault()
        s.onFocusSearch?.()
        return
      }
      if (isTypingTarget(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const { items: list, activeId: active } = s
      if (!list || list.length === 0) return
      const idx = list.findIndex((it) => it.id === active)

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault()
          const next = idx < 0 ? 0 : Math.min(list.length - 1, idx + 1)
          s.onMove?.(list[next].id)
          break
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault()
          const prev = idx < 0 ? 0 : Math.max(0, idx - 1)
          s.onMove?.(list[prev].id)
          break
        }
        case 'Enter': {
          if (idx >= 0) {
            e.preventDefault()
            s.onOpen?.(list[idx].id)
          }
          break
        }
        case 'x': {
          if (idx >= 0) {
            e.preventDefault()
            s.onToggleSelect?.(list[idx].id)
          }
          break
        }
        case 'e': {
          if (idx >= 0) {
            e.preventDefault()
            s.onMarkDone?.(list[idx].id)
          }
          break
        }
        default:
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
