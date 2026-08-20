"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { STATES, GOAL_STATE, ACTIONS, trainAgent, greedyPolicy, type QTable } from "@/lib/math-core/capstone-gridworld-agent";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-train-an-agent-in-a-gridworld";

function qBars(table: QTable) {
  return STATES.filter((s) => s !== GOAL_STATE).flatMap((s) => ACTIONS.map((a) => ({ label: `Q(${s}, ${a})`, value: table[s][a] })));
}

/** Intuition beat: step through the full training run, episode by episode, watching the Q-table converge. */
export function IntuitionDemo() {
  const trace = trainAgent();
  const [i, setI] = useState(0);
  const current = trace[i];

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`episode ${current.episode + 1}, step ${current.step}/${trace.length}: ${current.wasExploration ? "explore" : "exploit"} → "${current.action}"`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}>
          Next step
        </button>
        <button type="button" className={styles.button} onClick={() => setI(trace.length - 1)}>
          Skip to end
        </button>
      </div>
      <ContributionBars items={qBars(current.qTable)} readout="the Q-table so far" />
    </>
  );
}

/** Play beat: run the fully trained greedy policy from the start — it should solve the maze directly. */
export function PlayDemo() {
  const trace = trainAgent();
  const finalTable = trace[trace.length - 1].qTable;
  const policy = greedyPolicy(finalTable);
  const [state, setState] = useState(0);

  const step = () => {
    setState((s) => {
      if (s === GOAL_STATE) return 0;
      const action = policy[s];
      return action === "right" ? Math.min(GOAL_STATE, s + 1) : Math.max(0, s - 1);
    });
  };

  return (
    <>
      <StateTrack states={STATES} currentState={state} goalState={GOAL_STATE} readout={`trained policy: ${STATES.filter((s) => s !== GOAL_STATE).map((s) => `S${s}→${policy[s]}`).join(", ")}`} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={step}>
          {state === GOAL_STATE ? "Reset" : "Step with the trained policy"}
        </button>
      </div>
    </>
  );
}

/** Checkpoint: train until the greedy policy is "right" at every state — the actual optimal policy. */
export function GridworldCapstoneCheckpoint() {
  const trace = trainAgent();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = trace[i];
  const policy = greedyPolicy(current.qTable);
  const passed = STATES.filter((s) => s !== GOAL_STATE).every((s) => policy[s] === "right");

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Train until the greedy policy says <strong>&ldquo;right&rdquo;</strong> at every state — the actual optimal solution to this maze.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <StateTrack states={STATES} currentState={current.state} goalState={GOAL_STATE} readout={`step ${current.step}/${trace.length}`} />
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI((n) => Math.min(trace.length - 1, n + 1));
          }}
        >
          Next step
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setHasInteracted(true);
            setI(trace.length - 1);
          }}
        >
          Skip to end
        </button>
      </div>
      <ContributionBars items={qBars(current.qTable)} readout={`greedy policy so far: ${STATES.filter((s) => s !== GOAL_STATE).map((s) => `S${s}→${policy[s]}`).join(", ")}`} />
    </CheckpointFrame>
  );
}
