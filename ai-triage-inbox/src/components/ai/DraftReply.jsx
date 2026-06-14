import Button from '../common/Button.jsx'
import Spinner from '../common/Spinner.jsx'
import { useAiStore } from '../../state/AiCacheProvider.jsx'
import { cacheKey } from '../../hooks/useAiAssist.js'
import styles from './AiAssistPanel.module.css'

// Editable draft reply with the human-in-the-loop guarantees:
//  - While the user hasn't edited, the textarea mirrors the AI draft (incl.
//    live streaming).
//  - Once the user edits (userDirty), the AI NEVER overwrites their text. A
//    freshly generated draft is offered as a non-destructive suggestion with
//    explicit Apply / Dismiss.
//  - Edits persist per item (stored on the cache entry), so switching away and
//    back keeps the user's working copy.
export default function DraftReply({
  item,
  entry,
  isStreaming,
  onStop,
  onRetry,
  onRegenerate,
}) {
  const store = useAiStore()
  const key = cacheKey(item.id)

  const aiDraft = entry.draft || ''
  const userDirty = !!entry.userDirty
  const value = userDirty ? entry.userDraft ?? '' : aiDraft
  const draftReady = entry.status === 'success' || entry.status === 'stopped'

  // Offer the AI's draft as an explicit suggestion only when the user has their
  // own edits AND a (different) completed AI draft they haven't dismissed.
  const showSuggestion =
    userDirty &&
    !!aiDraft &&
    aiDraft !== value &&
    aiDraft !== entry.dismissedDraft &&
    draftReady

  const handleChange = (e) =>
    store.setEntry(key, { userDraft: e.target.value, userDirty: true })

  const applyAiDraft = () =>
    store.setEntry(key, {
      userDraft: null,
      userDirty: false,
      dismissedDraft: null,
    })

  const dismissSuggestion = () =>
    store.setEntry(key, { dismissedDraft: aiDraft })

  const copy = () => {
    if (value) navigator.clipboard?.writeText(value)
  }

  const isSpamEmpty = draftReady && !aiDraft && !userDirty

  return (
    <div className={styles.draft}>
      <div className={styles.draftHead}>
        <h4 className={styles.sectionTitle}>Draft reply</h4>
        <div className={styles.draftHeadActions}>
          {userDirty && <span className={styles.editedTag}>edited</span>}
          {isStreaming && (
            <span className={styles.streamingTag}>
              <Spinner size={12} /> generating…
            </span>
          )}
          {isStreaming ? (
            <Button variant="danger" size="sm" onClick={onStop}>
              Stop
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              ↻ Re-generate
            </Button>
          )}
        </div>
      </div>

      {showSuggestion && (
        <div className={styles.suggestion} role="status">
          <div className={styles.suggestionHead}>
            <strong>New AI draft available</strong>
            <span>Your edits are preserved — apply only if you want to.</span>
          </div>
          <pre className={styles.suggestionPreview}>{aiDraft}</pre>
          <div className={styles.suggestionActions}>
            <Button variant="primary" size="sm" onClick={applyAiDraft}>
              Apply AI draft
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissSuggestion}>
              Keep my version
            </Button>
          </div>
        </div>
      )}

      <textarea
        className={styles.draftText}
        value={value}
        onChange={handleChange}
        placeholder={
          isSpamEmpty
            ? 'No reply suggested — this looks like spam. Do not engage.'
            : isStreaming
              ? 'Draft is being generated…'
              : 'Write or edit the reply…'
        }
        aria-label="Draft reply (editable)"
        spellCheck="true"
        rows={8}
      />

      <div className={styles.draftFoot}>
        <span className={styles.charCount}>{value.length} chars</span>
        <div className={styles.draftFootActions}>
          {userDirty && aiDraft && (
            <Button variant="ghost" size="sm" onClick={applyAiDraft}>
              Reset to AI draft
            </Button>
          )}
          {entry.status === 'stopped' && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={copy}
            disabled={!value}
          >
            Copy
          </Button>
        </div>
      </div>
    </div>
  )
}
