"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { STATES, GOAL_STATE, runBellmanChecks, vStar, type BellmanCheck } from "@/lib/math-core/value-functions-and-bellman-equations";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "value-functions-and-bellman-equations";

function qBars(check: BellmanCheck) {
  return [
    { label: `Q*(${check.state}, left)`, value: check.qLeft },
    { label: `Q*(${check.state}, right)`, value: check.qRight },
  ];
}

/** Intuition beat: step through each state, checking that V*(s) equals max_a Q*(s,a). */
export function IntuitionDemo() {
  const checks = runBellmanChecks();
  const [i, setI] = useState(0);
  const current = checks[i];

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`V*(${current.state}) = ${current.vStarValue.toFixed(2)} — best action is "${current.bestAction}"`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous state
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(checks.length - 1, n + 1))}>
          Next state
        </button>
      </div>
      <ContributionBars
        items={qBars(current)}
        readout={`max(${current.qLeft.toFixed(2)}, ${current.qRight.toFixed(2)}) = ${current.maxQ.toFixed(2)} — ${current.matches ? "exactly V*" : "mismatch"}`}
      />
    </>
  );
}

/** Play beat: see every state's V*(s) laid out on the track at once. */
export function PlayDemo() {
  const valueLabels = STATES.map((s) => `V*=${vStar(s).toFixed(1)}`);
  return (
    <StateTrack
      states={STATES}
      currentState={0}
      goalState={GOAL_STATE}
      valueLabels={valueLabels}
      readout="the optimal value function — the best possible expected return from each state"
    />
  );
}

/** Checkpoint: step forward until reaching the state whose optimal value is exactly 10. */
export function ValueFunctionsCheckpoint() {
  const checks = runBellmanChecks();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = checks[i];
  const passed = Math.abs(current.vStarValue - 10) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until you reach the state whose optimal value <strong>V*(s)</strong> equals exactly <strong>10</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`V*(${current.state}) = ${current.vStarValue.toFixed(2)}`}
      />
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI((n) => Math.min(checks.length - 1, n + 1));
          }}
        >
          Next state
        </button>
      </div>
      <ContributionBars items={qBars(current)} readout={`Q*(${current.state}, left)=${current.qLeft.toFixed(2)}, Q*(${current.state}, right)=${current.qRight.toFixed(2)}`} />
    </CheckpointFrame>
  );
}
