"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  STATES,
  GOAL_STATE,
  ACTIONS,
  runDqn,
  qNet,
  tableSize,
  NETWORK_PARAM_COUNT,
  SCALE_STATE_COUNTS,
  type NetParams,
} from "@/lib/math-core/deep-q-networks";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "deep-q-networks";

function netQBars(params: NetParams) {
  return STATES.filter((s) => s !== GOAL_STATE).flatMap((s) =>
    ACTIONS.map((a) => ({ label: `Q(${s}, ${a})`, value: qNet(params, s, a) })),
  );
}

/** Intuition beat: step through the same 6-move script Q-learning used, but training a 6-number
 * network via gradient descent instead of updating table entries directly. */
export function IntuitionDemo() {
  const script = runDqn();
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
      <ContributionBars
        items={netQBars(current.params)}
        readout={`TD error = ${current.tdError.toFixed(3)}, loss = ${current.loss.toFixed(4)}`}
      />
    </>
  );
}

/** Play beat: watch a Q-table's size explode with the state count while the network stays fixed. */
export function PlayDemo() {
  const tableItems = SCALE_STATE_COUNTS.map((n) => ({ label: `table, |S|=${n}`, value: tableSize(n) }));
  const netItems = SCALE_STATE_COUNTS.map((n) => ({ label: `network, |S|=${n}`, value: NETWORK_PARAM_COUNT }));
  const ceiling = tableSize(SCALE_STATE_COUNTS[SCALE_STATE_COUNTS.length - 1]);

  return (
    <>
      <ContributionBars items={tableItems} max={ceiling} readout="Q-table entries needed: 2 per state, growing linearly" />
      <ContributionBars items={netItems} max={ceiling} readout={`network parameters needed: always ${NETWORK_PARAM_COUNT}, regardless of |S|`} />
    </>
  );
}

/** Checkpoint: step forward until the network's training loss drops below 0.05. */
export function DeepQNetworksCheckpoint() {
  const script = runDqn();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = script[i];
  const passed = current.loss < 0.05;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until the training loss drops below <strong>0.05</strong> — the network's prediction is nearly matching its bootstrapped target.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`step ${current.step}/6 — loss = ${current.loss.toFixed(4)}`}
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
      <ContributionBars items={netQBars(current.params)} readout={`loss = ${current.loss.toFixed(4)}`} />
    </CheckpointFrame>
  );
}
