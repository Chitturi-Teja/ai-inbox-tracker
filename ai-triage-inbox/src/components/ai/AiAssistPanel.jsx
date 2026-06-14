import { useAiAssist } from '../../hooks/useAiAssist.js'
import { useSettings } from '../../state/SettingsProvider.jsx'
import CategoryBadge from './CategoryBadge.jsx'
import ConfidenceMeter from './ConfidenceMeter.jsx'
import SummaryBullets from './SummaryBullets.jsx'
import DraftReply from './DraftReply.jsx'
import DebugPanel from './DebugPanel.jsx'
import PriorityBadge from '../common/PriorityBadge.jsx'
import Button from '../common/Button.jsx'
import Spinner from '../common/Spinner.jsx'
import Skeleton from '../common/Skeleton.jsx'
import ErrorState from '../common/ErrorState.jsx'
import styles from './AiAssistPanel.module.css'

function MetaSkeleton() {
  return (
    <div className={styles.section}>
      <Skeleton w="40%" h={12} />
      <div style={{ height: 8 }} />
      <Skeleton w="92%" h={10} />
      <div style={{ height: 6 }} />
      <Skeleton w="80%" h={10} />
      <div style={{ height: 6 }} />
      <Skeleton w="86%" h={10} />
    </div>
  )
}

export default function AiAssistPanel({ item }) {
  const { entry, regenerate, retry, stop, isBusy } = useAiAssist(item)
  const { debugMode } = useSettings()

  const { status, meta, error, raw, validation } = entry
  const hasMeta = !!meta
  const isStreaming = status === 'streaming'

  return (
    <section className={styles.panel} aria-label="AI assist">
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <span className={styles.sparkle} aria-hidden="true">
            ✨
          </span>
          <h3>AI Assist</h3>
          {isBusy && <Spinner size={14} label="Generating AI suggestions" />}
        </div>
        <span className={styles.assistNote}>Assistive — you stay in control</span>
      </header>

      {/* Network/transport error: explicit, with retry. */}
      {status === 'error' && (
        <ErrorState
          title="Couldn’t generate suggestions"
          message={error}
          onRetry={retry}
        />
      )}

      {/* Bad content (failed schema validation): route to debug + retry. */}
      {status === 'invalid' && (
        <div className={styles.invalid}>
          <ErrorState
            title="AI returned an unreadable response"
            message="The output didn’t match the expected format. You can retry, or inspect the raw output in Debug mode."
            onRetry={retry}
          />
        </div>
      )}

      {/* Loading first run (no meta yet). */}
      {status === 'loading' && !hasMeta && <MetaSkeleton />}

      {/* Meta available (loading-regenerate, streaming, success, stopped). */}
      {hasMeta && (
        <>
          <div className={styles.section}>
            <div className={styles.classRow}>
              <CategoryBadge category={meta.category} />
              <PriorityBadge priority={meta.priority} />
              <span className={styles.suggestsTag}>AI suggested</span>
            </div>
            <ConfidenceMeter value={meta.confidence} />
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Summary</h4>
            <SummaryBullets bullets={meta.summary_bullets} />
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Suggested next action</h4>
            <p className={styles.action}>{meta.suggested_action}</p>
          </div>

          <div className={styles.section}>
            <DraftReply
              item={item}
              entry={entry}
              isStreaming={isStreaming}
              onStop={stop}
              onRetry={retry}
              onRegenerate={regenerate}
            />
          </div>
        </>
      )}

      {status === 'stopped' && !hasMeta && (
        <div className={styles.section}>
          <p className={styles.stoppedNote}>Generation stopped before completing.</p>
          <Button variant="secondary" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {/* Debug mode: raw output + validation + retry, regardless of status. */}
      {debugMode && (
        <DebugPanel raw={raw} validation={validation} onRetry={retry} />
      )}
    </section>
  )
}
