import type { ReactNode } from "react";
import styles from "./Beats.module.css";
import frameStyles from "./CheckpointFrame.module.css";

export interface CheckpointFrameProps {
  instructions: ReactNode;
  passed: boolean;
  hasInteracted: boolean;
  /** What to show before the first interaction — phrase it for whatever the control actually is (drag, a button, a slider). */
  idleLabel?: string;
  children: ReactNode;
  /**
   * When set, pass/fail is hidden behind an explicit "Check answer" click instead of updating live —
   * without this, a checkpoint whose result is visible while dragging reduces to pure trial-and-error
   * against a live readout, with no need to understand why an answer is right. The caller owns
   * `revealed` state and should reset it to false on every interaction, so re-adjusting after a check
   * hides the previous verdict until checked again.
   */
  checkable?: boolean;
  revealed?: boolean;
  onCheck?: () => void;
}

/**
 * Generic chrome for a "manipulate-to-target" checkpoint: instructions, the
 * interactive control (passed in as children), and a pass/fail status line.
 * The target-check logic itself is chapter-specific and lives in the caller.
 */
export function CheckpointFrame({
  instructions,
  passed,
  hasInteracted,
  idleLabel = "Try it",
  children,
  checkable = false,
  revealed = true,
  onCheck,
}: CheckpointFrameProps) {
  const showResult = !checkable || revealed;
  const isPassed = showResult && passed;

  return (
    <section className={styles.beat}>
      <span className={styles.eyebrow}>Checkpoint</span>
      <div className={isPassed ? frameStyles.framePassed : frameStyles.frame}>
        <p className={frameStyles.instructions}>{instructions}</p>
        {children}
        {checkable && !revealed && (
          <button type="button" className={frameStyles.checkButton} onClick={onCheck} disabled={!hasInteracted}>
            Check answer
          </button>
        )}
        <div className={isPassed ? frameStyles.statusPassed : frameStyles.status}>
          {showResult
            ? isPassed
              ? "✓ Passed — mastery recorded"
              : hasInteracted
                ? "Not quite — adjust and check again"
                : idleLabel
            : hasInteracted
              ? "Ready — click Check answer"
              : idleLabel}
        </div>
      </div>
    </section>
  );
}
