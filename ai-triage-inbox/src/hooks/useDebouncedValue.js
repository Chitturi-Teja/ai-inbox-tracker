import { useEffect, useState } from 'react'

// Returns a debounced copy of `value`, updated at most once per `delay` ms.
// Used so client-side search doesn't filter the list on every keystroke.
export function useDebouncedValue(value, delay = 180) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}
