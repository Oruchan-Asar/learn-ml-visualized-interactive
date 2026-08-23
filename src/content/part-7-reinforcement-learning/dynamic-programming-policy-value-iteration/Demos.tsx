"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { STATES, GOAL_STATE, runValueIteration, type ValueTable } from "@/lib/math-core/dynamic-programming-policy-value-iteration";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "dynamic-programming-policy-value-iteration";

function vBars(V: ValueTable) {
  return STATES.filter((s) => s !== GOAL_STATE).map((s) => ({ label: `V(S${s})`, value: V[s] }));
}

/** Intuition beat: step sweep by sweep, watching a wrong initial guess converge to V*. */
export function IntuitionDemo() {
  const sweeps = runValueIteration(5);
  const [i, setI] = useState(0);
  const current = sweeps[i];
  const valueLabels = STATES.map((s) => `V=${current.V[s].toFixed(2)}`);

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={0}
        goalState={GOAL_STATE}
        valueLabels={valueLabels}
        readout={`sweep ${current.sweep}/${sweeps.length}${current.changed ? "" : " — no change from the previous sweep, converged"}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous sweep
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(sweeps.length - 1, n + 1))}>
          Next sweep
        </button>
      </div>
      <ContributionBars items={vBars(current.V)} readout="V(s) after this sweep, for every non-terminal state" />
    </>
  );
}

/** Play beat: compare the all-zero starting guess to the converged fixed point. */
export function PlayDemo() {
  const sweeps = runValueIteration(5);
  const initial = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const final = sweeps[sweeps.length - 1].V;
  return (
    <>
      <ContributionBars items={vBars(initial)} readout="before any sweeps — every state guessed at exactly 0" />
      <ContributionBars items={vBars(final)} readout="after 5 sweeps — a fixed point, matching V* exactly" />
    </>
  );
}

/** Checkpoint: sweep forward until the value table stops changing — the fixed point is reached. */
export function DynamicProgrammingCheckpoint() {
  const sweeps = runValueIteration(5);
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = sweeps[i];
  const passed = !current.changed;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Sweep forward until a sweep changes <strong>nothing</strong> — the value function has hit its fixed point.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Sweep forward to try it"
    >
      <StateTrack
        states={STATES}
        currentState={0}
        goalState={GOAL_STATE}
        valueLabels={STATES.map((s) => `V=${current.V[s].toFixed(2)}`)}
        readout={`sweep ${current.sweep}/${sweeps.length}`}
      />
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI((n) => Math.min(sweeps.length - 1, n + 1));
          }}
        >
          Next sweep
        </button>
      </div>
      <ContributionBars items={vBars(current.V)} readout={current.changed ? "still changing" : "unchanged from the previous sweep"} />
    </CheckpointFrame>
  );
}
