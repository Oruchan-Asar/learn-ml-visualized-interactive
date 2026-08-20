"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { STATES, GOAL_STATE, ACTIONS, runQLearning, type QTable } from "@/lib/math-core/q-learning";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "q-learning";

function qTableBars(table: QTable) {
  return STATES.filter((s) => s !== GOAL_STATE).flatMap((s) =>
    ACTIONS.map((a) => ({ label: `Q(${s}, ${a})`, value: table[s][a] })),
  );
}

/** Intuition beat: step through the fixed script, watching one Q-value update at a time. */
export function IntuitionDemo() {
  const script = runQLearning();
  const [i, setI] = useState(0);
  const current = script[i];

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`step ${current.step}/6: at S${current.state}, took "${current.action}" → S${current.nextState}, reward ${current.reward}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(script.length - 1, n + 1))}>
          Next step
        </button>
      </div>
      <ContributionBars items={qTableBars(current.qTable)} readout="the Q-table after this update" />
    </>
  );
}

/** Play beat: see the fully updated Q-table after all 6 scripted steps. */
export function PlayDemo() {
  const script = runQLearning();
  const final = script[script.length - 1].qTable;
  return (
    <ContributionBars
      items={qTableBars(final)}
      readout="Q(2, right) already reflects the goal; everything further back is still catching up"
    />
  );
}

/** Checkpoint: step forward until the goal's reward has propagated into the Q-table at all. */
export function QLearningCheckpoint() {
  const script = runQLearning();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = script[i];
  const passed = current.qTable[2].right > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until <strong>Q(2, right)</strong> turns positive — the first sign the goal&apos;s reward has entered the table.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`step ${current.step}/6`}
      />
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI((n) => Math.min(script.length - 1, n + 1));
          }}
        >
          Next step
        </button>
      </div>
      <ContributionBars items={qTableBars(current.qTable)} readout={`Q(2, right) = ${current.qTable[2].right.toFixed(2)}`} />
    </CheckpointFrame>
  );
}
