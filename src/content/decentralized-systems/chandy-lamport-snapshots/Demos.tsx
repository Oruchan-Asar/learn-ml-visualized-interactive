"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  NODES,
  EVENTS,
  runSnapshot,
  snapshotTotal,
  stateOnlyTotal,
  TOTAL_MONEY,
  type ChannelState,
} from "@/lib/math-core/chandy-lamport-snapshots";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "chandy-lamport-snapshots";

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

function StepScript({ index, total, text, kind }: { index: number; total: number; text: string; kind: string }) {
  return (
    <div className={styles.script}>
      <span className={styles.phaseTag}>{kindTag(kind)}</span>
      {text}
      <div className={styles.stepCount} style={{ marginTop: 8 }}>
        Step {index + 1} of {total}
      </div>
    </div>
  );
}

function StatusTable({ channels }: { channels: ChannelState[] }) {
  return (
    <div className={styles.script} style={{ marginTop: 8 }}>
      {channels.map((c) => (
        <div key={`${c.from}->${c.to}`}>
          <strong>
            {c.from} → {c.to}
          </strong>
          : {c.status}
          {c.messages.length > 0 ? ` — [${c.messages.map((m) => m.description).join(", ")}]` : ""}
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: step through the fixed 15-event trace, watching who records state and when each channel closes. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const event = EVENTS[i];
  const partial = useMemo(() => runSnapshot(EVENTS.slice(0, i + 1)), [i]);

  return (
    <>
      <StepScript index={i} total={EVENTS.length} kind={event.kind} text={event.description} />
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

/** Play beat: step through the same trace, but toggle whether the running total counts channel state at all. */
export function PlayDemo() {
  const [i, setI] = useState(EVENTS.length - 1);
  const [countChannels, setCountChannels] = useState(true);
  const result = useMemo(() => runSnapshot(EVENTS.slice(0, i + 1)), [i]);
  const event = EVENTS[i];

  const total = countChannels ? snapshotTotal(result) : stateOnlyTotal(result);
  const matches = total === TOTAL_MONEY;

  return (
    <>
      <StepScript index={i} total={EVENTS.length} kind={event.kind} text={event.description} />
      <StatusTable channels={result.channels} />
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
        <button type="button" className={countChannels ? styles.buttonPrimary : styles.button} onClick={() => setCountChannels((c) => !c)}>
          Count channel state: {countChannels ? "on" : "off"}
        </button>
        <span className={styles.stepCount}>
          Total = {total} (true total = {TOTAL_MONEY}) — {matches ? "matches" : "MISMATCH"}
        </span>
      </div>
    </>
  );
}

/**
 * Checkpoint: identify which of the 6 channels ends up holding an in-flight message once the
 * snapshot completes. Only N2->N0 does — everything else closes empty.
 */
export function ChandyLamportSnapshotsCheckpoint() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = useMemo(() => runSnapshot(EVENTS), []);
  const nonEmpty = new Set(result.channels.filter((c) => c.messages.length > 0).map((c) => `${c.from}->${c.to}`));

  const passed =
    selected.size === nonEmpty.size && [...selected].every((k) => nonEmpty.has(k)) && nonEmpty.size > 0;

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

  return (
    <CheckpointFrame
      instructions={
        <>
          The snapshot is complete. Click every channel that ended up holding an in-flight message
          once it closed — leave the rest unselected.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click channels to select them"
    >
      <div className={styles.buttons}>
        {result.channels.map((c) => {
          const key = `${c.from}->${c.to}`;
          return (
            <button
              key={key}
              type="button"
              className={selected.has(key) ? styles.buttonPrimary : styles.button}
              onClick={() => toggle(key)}
            >
              {c.from} → {c.to}
            </button>
          );
        })}
      </div>
    </CheckpointFrame>
  );
}
