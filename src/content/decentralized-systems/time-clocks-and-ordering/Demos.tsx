"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  EVENTS,
  PROCESS_NAMES,
  LAMPORT_TIMESTAMPS,
  VECTOR_CLOCKS,
  compareVectorClocks,
  type ClockRelation,
} from "@/lib/math-core/time-clocks-and-ordering";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "time-clocks-and-ordering";

function vcBars(vc: number[]) {
  return PROCESS_NAMES.map((name, i) => ({ label: name, value: vc[i] }));
}

/** Intuition beat: step through the 9-event trace one at a time, watching each process's vector clock grow. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const e = EVENTS[i];
  const vc = VECTOR_CLOCKS[e.id];

  return (
    <>
      <div className={styles.script}>
        <span className={styles.phaseTag}>{PROCESS_NAMES[e.process]}</span>
        {e.label}
      </div>
      <ContributionBars items={vcBars(vc)} max={7} readout={`vector clock at ${e.id}`} />
      <div className={styles.buttons} style={{ marginTop: 10 }}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          ← Previous
        </button>
        <span className={styles.stepCount}>
          Step {i + 1} of {EVENTS.length}
        </span>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => setI((n) => Math.min(EVENTS.length - 1, n + 1))}
          disabled={i === EVENTS.length - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}

/** Play beat: pick any two events and watch compareVectorClocks derive their exact relation live. */
export function PlayDemo() {
  const [aId, setAId] = useState("e2");
  const [bId, setBId] = useState("e7");
  const relation: ClockRelation = compareVectorClocks(VECTOR_CLOCKS[aId], VECTOR_CLOCKS[bId]);

  return (
    <>
      <div className={styles.buttons}>
        <label className={styles.stepCount}>
          A:{" "}
          <select value={aId} onChange={(e) => setAId(e.target.value)}>
            {EVENTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} — {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.stepCount}>
          B:{" "}
          <select value={bId} onChange={(e) => setBId(e.target.value)}>
            {EVENTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} — {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ContributionBars items={vcBars(VECTOR_CLOCKS[aId])} max={7} readout={`${aId} = [${VECTOR_CLOCKS[aId].join(", ")}]  (Lamport ${LAMPORT_TIMESTAMPS[aId]})`} />
      <ContributionBars items={vcBars(VECTOR_CLOCKS[bId])} max={7} readout={`${bId} = [${VECTOR_CLOCKS[bId].join(", ")}]  (Lamport ${LAMPORT_TIMESTAMPS[bId]})`} />
      <div className={styles.script}>
        compareVectorClocks({aId}, {bId}) = <strong>{relation}</strong>
      </div>
    </>
  );
}

/** Checkpoint: find a pair of events that are genuinely concurrent — neither vector clock dominates the other. */
export function TimeClocksCheckpoint() {
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const relation = aId && bId && aId !== bId ? compareVectorClocks(VECTOR_CLOCKS[aId], VECTOR_CLOCKS[bId]) : null;
  const passed = relation === "concurrent";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const pick = (id: string) => {
    setHasInteracted(true);
    if (!aId || (bId && id !== aId)) {
      setAId(id);
      setBId(null);
    } else if (id !== aId) {
      setBId(id);
    }
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Click two different events (in order, A then B) that are <strong>concurrent</strong> — no chain of
          messages links them either way.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an event to select A, then another for B"
    >
      <div className={styles.buttons}>
        {EVENTS.map((e) => (
          <button
            key={e.id}
            type="button"
            className={e.id === aId || e.id === bId ? styles.buttonPrimary : styles.button}
            onClick={() => pick(e.id)}
          >
            {e.id}
          </button>
        ))}
      </div>
      <div className={styles.script}>
        {aId ? `A = ${aId} [${VECTOR_CLOCKS[aId].join(", ")}]` : "A = (pick one)"}
        <br />
        {bId ? `B = ${bId} [${VECTOR_CLOCKS[bId].join(", ")}]` : "B = (pick one)"}
        <br />
        relation: <strong>{relation ?? "—"}</strong>
      </div>
    </CheckpointFrame>
  );
}
