"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  zeroState,
  increment,
  merge,
  value,
  statesEqual,
  type GCounterState,
} from "@/lib/math-core/crdts-conflict-free-replicated-data-types";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./CrdtControls.module.css";

const CONCEPT_ID = "crdts-conflict-free-replicated-data-types";

function slotsLabel(state: GCounterState) {
  return Object.entries(state)
    .map(([k, v]) => `${k}:${v}`)
    .join("  ");
}

/** Intuition beat: two replicas increment independently, then an explicit "merge" makes them converge. */
export function IntuitionDemo() {
  const [pState, setPState] = useState<GCounterState>(zeroState(["P", "Q"]));
  const [qState, setQState] = useState<GCounterState>(zeroState(["P", "Q"]));
  const converged = statesEqual(pState, qState);

  return (
    <>
      <div className={styles.replicaRow}>
        <div className={converged ? styles.replicaBoxConverged : styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica P</span>
          <span className={styles.replicaSlots}>{slotsLabel(pState)}</span>
          <span className={styles.replicaValue}>value {value(pState)}</span>
          <button type="button" className={styles.button} onClick={() => setPState(increment(pState, "P"))}>
            P increments locally
          </button>
        </div>
        <div className={converged ? styles.replicaBoxConverged : styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica Q</span>
          <span className={styles.replicaSlots}>{slotsLabel(qState)}</span>
          <span className={styles.replicaValue}>value {value(qState)}</span>
          <button type="button" className={styles.button} onClick={() => setQState(increment(qState, "Q"))}>
            Q increments locally
          </button>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              const merged = merge(pState, qState);
              setPState(merged);
              setQState(merged);
            }}
          >
            Merge P & Q
          </button>
        </div>
        <div>{converged ? "converged — both replicas now agree" : "P and Q currently disagree, with no coordination between their clicks"}</div>
      </div>
    </>
  );
}

/** Play beat: increment P and Q in any interleaving you like — merge(P,Q) and merge(Q,P) always match. */
export function PlayDemo() {
  const [pState, setPState] = useState<GCounterState>(zeroState(["P", "Q"]));
  const [qState, setQState] = useState<GCounterState>(zeroState(["P", "Q"]));
  const mergedFromP = merge(pState, qState);
  const mergedFromQ = merge(qState, pState);

  return (
    <>
      <div className={styles.replicaRow}>
        <div className={styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica P</span>
          <span className={styles.replicaSlots}>{slotsLabel(pState)}</span>
          <button type="button" className={styles.button} onClick={() => setPState(increment(pState, "P"))}>
            P increments
          </button>
        </div>
        <div className={styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica Q</span>
          <span className={styles.replicaSlots}>{slotsLabel(qState)}</span>
          <button type="button" className={styles.button} onClick={() => setQState(increment(qState, "Q"))}>
            Q increments
          </button>
        </div>
      </div>
      <div className={styles.controls}>
        <div>merge(P, Q) = {slotsLabel(mergedFromP)} (value {value(mergedFromP)})</div>
        <div>merge(Q, P) = {slotsLabel(mergedFromQ)} (value {value(mergedFromQ)})</div>
        <div>{statesEqual(mergedFromP, mergedFromQ) ? "identical either way, at any point" : "should never happen"}</div>
      </div>
    </>
  );
}

const START_P: GCounterState = { P: 3, Q: 0, R: 0 }; // P made 3 independent local increments
const START_Q: GCounterState = { P: 0, Q: 2, R: 0 }; // Q made 2, concurrently, with no coordination
const START_R: GCounterState = { P: 0, Q: 0, R: 1 }; // R made 1

/** Checkpoint: sync replicas pairwise, in any order, until all three fully converge. */
export function CrdtCheckpoint() {
  const [pState, setPState] = useState<GCounterState>(START_P);
  const [qState, setQState] = useState<GCounterState>(START_Q);
  const [rState, setRState] = useState<GCounterState>(START_R);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = statesEqual(pState, qState) && statesEqual(qState, rState);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const sync = (
    getA: () => GCounterState,
    setA: (s: GCounterState) => void,
    getB: () => GCounterState,
    setB: (s: GCounterState) => void,
  ) => {
    setHasInteracted(true);
    const merged = merge(getA(), getB());
    setA(merged);
    setB(merged);
  };

  return (
    <CheckpointFrame
      instructions={
        <>
          P, Q, and R each incremented independently, with no coordination. Using the sync buttons
          below in <strong>any order you like</strong>, get all three replicas to fully converge.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Sync any pair to begin"
    >
      <div className={styles.replicaRow}>
        <div className={passed ? styles.replicaBoxConverged : styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica P</span>
          <span className={styles.replicaSlots}>{slotsLabel(pState)}</span>
          <span className={styles.replicaValue}>value {value(pState)}</span>
        </div>
        <div className={passed ? styles.replicaBoxConverged : styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica Q</span>
          <span className={styles.replicaSlots}>{slotsLabel(qState)}</span>
          <span className={styles.replicaValue}>value {value(qState)}</span>
        </div>
        <div className={passed ? styles.replicaBoxConverged : styles.replicaBox}>
          <span className={styles.replicaLabel}>Replica R</span>
          <span className={styles.replicaSlots}>{slotsLabel(rState)}</span>
          <span className={styles.replicaValue}>value {value(rState)}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.button} onClick={() => sync(() => pState, setPState, () => qState, setQState)}>
            Sync P ↔ Q
          </button>
          <button type="button" className={styles.button} onClick={() => sync(() => qState, setQState, () => rState, setRState)}>
            Sync Q ↔ R
          </button>
          <button type="button" className={styles.button} onClick={() => sync(() => pState, setPState, () => rState, setRState)}>
            Sync P ↔ R
          </button>
        </div>
      </div>
    </CheckpointFrame>
  );
}
