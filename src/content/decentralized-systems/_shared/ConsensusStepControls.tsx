"use client";

import type { ReactNode } from "react";
import styles from "./ConsensusStepControls.module.css";

export interface StepNavProps {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Previous/Next chrome plus a "Step N of M" counter, for a fixed protocol-trace script. */
export function StepNav({ index, total, onPrev, onNext }: StepNavProps) {
  return (
    <div className={styles.stepRow}>
      <button type="button" className={styles.button} onClick={onPrev} disabled={index === 0}>
        ← Previous
      </button>
      <span className={styles.counter}>
        Step {index + 1} of {total}
      </span>
      <button type="button" className={styles.button} onClick={onNext} disabled={index === total - 1}>
        Next →
      </button>
    </div>
  );
}

/** A fixed protocol-trace script rendered as monospace lines, paired with Previous/Next controls. */
export function StepTrace({
  lines,
  index,
  total,
  onPrev,
  onNext,
  footer,
}: {
  lines: ReactNode;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.script}>{lines}</div>
      <StepNav index={index} total={total} onPrev={onPrev} onNext={onNext} />
      {footer && <div className={styles.readout}>{footer}</div>}
    </div>
  );
}
