"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  EVENTS,
  VECTOR_CLOCKS,
  LAMPORT_TIMESTAMPS,
  PROCESS_NAMES,
  eventHappenedBefore,
  eventsAreConcurrent,
  lamportFalselyOrders,
} from "@/lib/math-core/causality-and-happened-before";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../_shared/StepControls.module.css";

const CONCEPT_ID = "causality-and-happened-before";

const processLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 400,
  opacity: 0.7,
  marginTop: 2,
};

/** Every button doubles as "which process is this?" — the picker alone can't otherwise tell e1 and e6 apart. */
function EventButtonLabel({ e }: { e: (typeof EVENTS)[number] }) {
  return (
    <>
      <span style={{ display: "block" }}>{e.id}</span>
      <span style={processLabelStyle}>{PROCESS_NAMES[e.process]}</span>
    </>
  );
}

function EventPicker({ selectedId, onPick }: { selectedId: string | null; onPick: (id: string) => void }) {
  return (
    <div className={styles.buttons}>
      {EVENTS.map((e) => (
        <button
          key={e.id}
          type="button"
          className={e.id === selectedId ? styles.buttonPrimary : styles.button}
          onClick={() => onPick(e.id)}
          title={e.label}
        >
          <EventButtonLabel e={e} />
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

/**
 * Checkpoint: pick one event as A, then select every OTHER event that's concurrent with it yet still
 * received a different Lamport number — no more, no less. A single lucky pair is easy to stumble into
 * (7 of the 36 pairs in this trace qualify); matching the *exact* set for a chosen A is not.
 */
export function CausalityCheckpoint() {
  const [aId, setAId] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const candidates = aId ? EVENTS.filter((e) => e.id !== aId) : [];
  const correctSet = new Set(
    aId
      ? candidates
          .filter((e) => eventsAreConcurrent(aId, e.id) && LAMPORT_TIMESTAMPS[aId] !== LAMPORT_TIMESTAMPS[e.id])
          .map((e) => e.id)
      : [],
  );
  const passed =
    aId !== null &&
    correctSet.size > 0 &&
    selectedB.size === correctSet.size &&
    [...selectedB].every((id) => correctSet.has(id));

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const pickA = (id: string) => {
    setHasInteracted(true);
    setAId(id);
    setSelectedB(new Set());
  };

  const toggleB = (id: string) => {
    setHasInteracted(true);
    setSelectedB((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          Click one event to fix as <strong>A</strong>, then select <strong>every other event</strong> that&apos;s
          concurrent with it but still got a <strong>different Lamport timestamp</strong> — the whole set, nothing
          more. That&apos;s exactly where a scalar clock&apos;s total order is fiction.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click an event to select A"
    >
      <div className={styles.stepCount}>A:</div>
      <div className={styles.buttons}>
        {EVENTS.map((e) => (
          <button
            key={e.id}
            type="button"
            className={e.id === aId ? styles.buttonPrimary : styles.button}
            onClick={() => pickA(e.id)}
            title={e.label}
          >
            <EventButtonLabel e={e} />
          </button>
        ))}
      </div>

      {aId && (
        <>
          <div className={styles.stepCount} style={{ marginTop: 8 }}>
            B (select all that qualify):
          </div>
          <div className={styles.buttons}>
            {candidates.map((e) => (
              <button
                key={e.id}
                type="button"
                className={selectedB.has(e.id) ? styles.buttonPrimary : styles.button}
                onClick={() => toggleB(e.id)}
                title={e.label}
              >
                <EventButtonLabel e={e} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.script}>
        {aId ? `A = ${aId} (Lamport ${LAMPORT_TIMESTAMPS[aId]})` : "A = (pick one)"}
        <br />
        {aId && correctSet.size === 0 &&
          `Every other event is causally ordered against ${aId}, or ties its Lamport number — pick a different A.`}
        {aId && correctSet.size > 0 &&
          `B = ${selectedB.size ? [...selectedB].sort().join(", ") : "(none selected yet)"}`}
      </div>
    </CheckpointFrame>
  );
}
