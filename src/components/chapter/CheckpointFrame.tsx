import type { ReactNode } from "react";
import styles from "./Beats.module.css";
import frameStyles from "./CheckpointFrame.module.css";

export interface CheckpointFrameProps {
  instructions: ReactNode;
  passed: boolean;
  hasInteracted: boolean;
  children: ReactNode;
}

/**
 * Generic chrome for a "manipulate-to-target" checkpoint: instructions, the
 * interactive control (passed in as children), and a pass/fail status line.
 * The target-check logic itself is chapter-specific and lives in the caller.
 */
export function CheckpointFrame({ instructions, passed, hasInteracted, children }: CheckpointFrameProps) {
  return (
    <section className={styles.beat}>
      <span className={styles.eyebrow}>Checkpoint</span>
      <div className={passed ? frameStyles.framePassed : frameStyles.frame}>
        <p className={frameStyles.instructions}>{instructions}</p>
        {children}
        <div className={passed ? frameStyles.statusPassed : frameStyles.status}>
          {passed ? "✓ Passed — mastery recorded" : hasInteracted ? "Not quite — keep adjusting" : "Drag the point to try it"}
        </div>
      </div>
    </section>
  );
}
