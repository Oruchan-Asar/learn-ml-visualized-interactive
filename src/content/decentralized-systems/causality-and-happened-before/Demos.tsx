"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  EVENTS,
  VECTOR_CLOCKS,
  LAMPORT_TIMESTAMPS,
  eventHappenedBefore,
  eventsAreConcurrent,
  lamportFalselyOrders,
} from "@/lib/math-core/causality-and-happened-before";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "causality-and-happened-before";

function EventPicker({ selectedId, onPick }: { selectedId: string | null; onPick: (id: string) => void }) {
  return (
    <div className={styles.buttons}>
      {EVENTS.map((e) => (
        <button
          key={e.id}
          type="button"
          className={e.id === selectedId ? styles.buttonPrimary : styles.button}
          onClick={() => onPick(e.id)}
        >
          {e.id}
        </button>
      ))}
    </div>
  );
}

function relationLabel(aId: string, bId: string): string {
  if (aId === bId) return "same event";
  if (eventHappenedBefore(aId, bId)) return `${aId} causally precedes ${bId} — a message chain connects them`;
  if (eventHappenedBefore(bId, aId)) return `${bId} causally precedes ${aId} — a message chain connects them`;
  if (eventsAreConcurrent(aId, bId)) return `${aId} and ${bId} are concurrent — no message chain links them either way`;
  return "—";
}

/** Intuition beat: click two events and see, in plain language, whether a chain of messages connects them. */
export function IntuitionDemo() {
  const [aId, setAId] = useState("e2");
  const [bId, setBId] = useState("e7");

  return (
    <>
      <div className={styles.stepCount}>A:</div>
      <EventPicker selectedId={aId} onPick={setAId} />
      <div className={styles.stepCount} style={{ marginTop: 8 }}>B:</div>
      <EventPicker selectedId={bId} onPick={setBId} />
      <div className={styles.script} style={{ marginTop: 10 }}>{relationLabel(aId, bId)}</div>
    </>
  );
}

/** Play beat: same two-event picker, now showing both vector clocks and whether Lamport would have lied about it. */
export function PlayDemo() {
  const [aId, setAId] = useState("e3");
  const [bId, setBId] = useState("e6");
  const concurrent = aId !== bId && eventsAreConcurrent(aId, bId);
  const falsely = aId !== bId && lamportFalselyOrders(aId, bId);

  return (
    <>
      <div className={styles.stepCount}>A:</div>
      <EventPicker selectedId={aId} onPick={setAId} />
      <div className={styles.stepCount} style={{ marginTop: 8 }}>B:</div>
      <EventPicker selectedId={bId} onPick={setBId} />

      <ContributionBars
        items={[
          { label: `${aId} Lamport`, value: LAMPORT_TIMESTAMPS[aId] },
          { label: `${bId} Lamport`, value: LAMPORT_TIMESTAMPS[bId] },
        ]}
        max={7}
        readout={`vectors: ${aId}=[${VECTOR_CLOCKS[aId].join(",")}]  ${bId}=[${VECTOR_CLOCKS[bId].join(",")}]`}
      />
      <div className={styles.script}>
        {relationLabel(aId, bId)}
        <br />
        lamportFalselyOrders({aId}, {bId}) = <strong>{String(falsely)}</strong>
        {concurrent && falsely && " — concurrent, yet Lamport still handed them different numbers."}
      </div>
    </>
  );
}

/** Checkpoint: find a pair of events where Lamport's total order is a genuine fabrication — concurrent, yet numbered differently. */
export function CausalityCheckpoint() {
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = Boolean(aId && bId && aId !== bId && lamportFalselyOrders(aId, bId));

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
          Click two events (A then B) that are <strong>concurrent</strong> but were still handed{" "}
          <strong>different Lamport timestamps</strong> — the exact case where a scalar clock&apos;s total order is
          fiction.
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
        {aId ? `A = ${aId} (Lamport ${LAMPORT_TIMESTAMPS[aId]})` : "A = (pick one)"}
        <br />
        {bId ? `B = ${bId} (Lamport ${LAMPORT_TIMESTAMPS[bId]})` : "B = (pick one)"}
        <br />
        {aId && bId && aId !== bId ? relationLabel(aId, bId) : ""}
      </div>
    </CheckpointFrame>
  );
}
