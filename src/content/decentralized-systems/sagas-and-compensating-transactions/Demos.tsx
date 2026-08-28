"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TokenChips } from "@/components/viz/TokenChips";
import { STEPS, runSaga, compensationCount, type TraceEntry } from "@/lib/math-core/sagas-and-compensating-transactions";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "sagas-and-compensating-transactions";

/** Prefixes each trace entry's action with a symbol so the (uniformly-styled) chip row still reads its status. */
function chipLabel(entry: TraceEntry): string {
  if (entry.kind === "forward") return `✓ ${entry.action}`;
  if (entry.kind === "failed") return `✗ ${entry.action}`;
  return `↺ ${entry.action}`;
}

/** Intuition beat: step through a saga that fails on its last step, watching compensations unwind in reverse. */
export function IntuitionDemo() {
  const trace = useMemo(() => runSaga(3), []);
  const [i, setI] = useState(0);

  return (
    <>
      <TokenChips tokens={trace.slice(0, i + 1).map(chipLabel)} />
      <div className={styles.script}>{trace[i].kind === "compensation" ? `Undoing: ${trace[i].action}` : trace[i].action}</div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
          disabled={i === trace.length - 1}
        >
          Next
        </button>
      </div>
    </>
  );
}

/** Play beat: pick where the saga fails (or let it fully succeed) and watch which steps get undone, and in what order. */
export function PlayDemo() {
  const [failAt, setFailAt] = useState<number | null>(2);
  const trace = useMemo(() => runSaga(failAt), [failAt]);
  const [i, setI] = useState(0);

  const choose = (v: number | null) => {
    setFailAt(v);
    setI(0);
  };

  return (
    <>
      <div className={styles.buttons}>
        {STEPS.map((s, idx) => (
          <button key={idx} type="button" className={failAt === idx ? styles.buttonPrimary : styles.button} onClick={() => choose(idx)}>
            Fail at: {s.name}
          </button>
        ))}
        <button type="button" className={failAt === null ? styles.buttonPrimary : styles.button} onClick={() => choose(null)}>
          No failure
        </button>
      </div>
      <TokenChips tokens={trace.slice(0, i + 1).map(chipLabel)} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}
          disabled={i === trace.length - 1}
        >
          Next
        </button>
        <span className={styles.stepCount}>{compensationCount(failAt)} step(s) compensated this run</span>
      </div>
    </>
  );
}

/** Checkpoint: find the failure point that compensates exactly 2 steps. */
export function SagaCheckpoint() {
  const [failAt, setFailAt] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = compensationCount(failAt) === 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const choose = (v: number | null) => {
    setHasInteracted(true);
    setFailAt(v);
  };

  return (
    <CheckpointFrame
      instructions={<>Pick the step that should fail so that <strong>exactly 2</strong> completed steps get compensated.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a failure point"
    >
      <div className={styles.buttons}>
        {STEPS.map((s, idx) => (
          <button key={idx} type="button" className={failAt === idx ? styles.buttonPrimary : styles.button} onClick={() => choose(idx)}>
            Fail at: {s.name}
          </button>
        ))}
      </div>
      {failAt !== null && (
        <div className={styles.script}>{compensationCount(failAt)} step(s) would be compensated: {STEPS.slice(0, failAt).map((s) => s.compensation).reverse().join(", ") || "none"}</div>
      )}
    </CheckpointFrame>
  );
}
