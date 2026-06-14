import { createContext, useContext, useMemo, useState } from 'react'
import { isRealAiConfigured } from '../lib/realAi.js'

// App-wide settings: which AI backend to use and whether Debug mode is on.
// Kept separate from inbox data so toggling debug doesn't touch list state.

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  // Default to Mock mode always (works with no key); only allow real if configured.
  const [mockMode, setMockMode] = useState(true)
  const [debugMode, setDebugMode] = useState(false)

  const value = useMemo(
    () => ({
      mockMode,
      debugMode,
      realAiAvailable: isRealAiConfigured(),
      toggleMockMode: () => setMockMode((m) => !m),
      toggleDebugMode: () => setDebugMode((d) => !d),
    }),
    [mockMode, debugMode],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
