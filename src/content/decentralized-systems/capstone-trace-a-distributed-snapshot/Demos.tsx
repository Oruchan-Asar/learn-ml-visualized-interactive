"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  NODES,
  ALL_CHANNELS,
  EVENTS,
  TOTAL_MONEY,
  runCapstoneSnapshot,
  snapshotTotal,
  stateOnlyTotal,
  isConsistentSnapshot,
} from "@/lib/math-core/capstone-trace-a-distributed-snapshot";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "capstone-trace-a-distributed-snapshot";

function kindTag(kind: string): string {
  switch (kind) {
    case "initiate":
      return "INITIATE";
    case "marker-send":
    case "marker-receive":
      return "MARKER";
    default:
      return "APP MSG";
  }
}

/** Intuition beat: step through this chapter's own 17-event trace — a different initiator, two in-flight messages. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const event = EVENTS[i];
  const partial = useMemo(() => runCapstoneSnapshot(EVENTS.slice(0, i + 1)), [i]);

  return (
    <>
      <div className={styles.script}>
        <span className={styles.phaseTag}>{kindTag(event.kind)}</span>
        {event.description}
        <div className={styles.stepCount} style={{ marginTop: 8 }}>
          Step {i + 1} of {EVENTS.length}
        </div>
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(EVENTS.length - 1, n + 1))}
          disabled={i === EVENTS.length - 1}
        >
          Next
        </button>
        <span className={styles.stepCount}>
          Recorded so far: {NODES.map((n) => `${n}=${partial.recordedStates[n] ?? "?"}`).join(", ")}
        </span>
      </div>
    </>
  );
}

/** Play beat: scrub through the trace and watch each of the 6 channels move from not-yet-recording to open to closed. */
export function PlayDemo() {
  const [i, setI] = useState(0);
  const result = useMemo(() => runCapstoneSnapshot(EVENTS.slice(0, i + 1)), [i]);
  const event = EVENTS[i];
  const total = snapshotTotal(result);
  const complete = result.completedAtIndex !== null;

  return (
    <>
      <div className={styles.script}>
        <span className={styles.phaseTag}>{kindTag(event.kind)}</span>
        {event.description}
      </div>
      <div className={styles.script} style={{ marginTop: 8 }}>
        {result.channels.map((c) => (
          <div key={`${c.from}->${c.to}`}>
            <strong>
              {c.from} → {c.to}
            </strong>
            : {c.status}
            {c.messages.length > 0 ? ` — [${c.messages.map((m) => m.description).join(", ")}]` : ""}
          </div>
        ))}
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(EVENTS.length - 1, n + 1))}
          disabled={i === EVENTS.length - 1}
        >
          Next
        </button>
        <span className={styles.stepCount}>
          Step {i + 1} of {EVENTS.length} — total so far: {total} / true total: {TOTAL_MONEY}
          {complete ? (isConsistentSnapshot(result) ? " — snapshot complete and consistent" : " — snapshot complete but INCONSISTENT") : ""}
        </span>
      </div>
    </>
  );
}

/**
 * Checkpoint: given the completed snapshot, reconstruct the full consistent cut by selecting
 * exactly the channels that hold an in-flight message (N2->N0 and N0->N1) and no others, then
 * confirm the resulting total matches the true starting total.
 */
export function CapstoneTraceADistributedSnapshotCheckpoint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = useMemo(() => runCapstoneSnapshot(EVENTS), []);
  const nonEmpty = new Set(result.channels.filter((c) => c.messages.length > 0).map((c) => `${c.from}->${c.to}`));

  const passed = selected.size === nonEmpty.size && [...selected].every((k) => nonEmpty.has(k)) && nonEmpty.size > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const toggle = (key: string) => {
    setHasInteracted(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const stateTotal = stateOnlyTotal(result);
  const reconstructedTotal = stateTotal + [...selected].reduce((sum, key) => {
    const c = result.channels.find((c) => `${c.from}->${c.to}` === key)!;
    return sum + c.messages.reduce((s, m) => s + m.amount, 0);
  }, 0);

  return (
    <CheckpointFrame
      instructions={
        <>
          The snapshot finished across all 6 channels. Click every channel that closed holding an
          in-flight message. Your running total should reach {TOTAL_MONEY} — the true starting
          total — only once you&apos;ve found exactly the right channels.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click channels to select them"
    >
      <div className={styles.buttons}>
        {ALL_CHANNELS.map(([from, to]) => {
          const key = `${from}->${to}`;
          return (
            <button
              key={key}
              type="button"
              className={selected.has(key) ? styles.buttonPrimary : styles.button}
              onClick={() => toggle(key)}
            >
              {from} → {to}
            </button>
          );
        })}
      </div>
      <div className={styles.script}>
        Reconstructed total: {reconstructedTotal} (recorded states alone: {stateTotal}, true total: {TOTAL_MONEY})
      </div>
    </CheckpointFrame>
  );
}
