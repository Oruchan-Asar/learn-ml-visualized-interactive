"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  STATES,
  GOAL_STATE,
  ACTIONS,
  policyAt,
  runActorCritic,
  type ActorCriticStep,
} from "@/lib/math-core/actor-critic-architectures";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "actor-critic-architectures";

function actorBars(step: ActorCriticStep) {
  const pi = policyAt(step.actor, step.state);
  return ACTIONS.map((a) => ({ label: `π(${a} | S${step.state})`, value: pi[a] }));
}

function criticBars(step: ActorCriticStep) {
  return STATES.filter((s) => s !== GOAL_STATE).map((s) => ({ label: `V(S${s})`, value: step.critic[s] }));
}

/** Intuition beat: step through a fixed trace, watching the actor's probabilities and the critic's
 * value estimates update together, side by side, off the exact same TD error each step. */
export function IntuitionDemo() {
  const script = runActorCritic();
  const [i, setI] = useState(0);
  const current = script[i];

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={current.state}
        goalState={GOAL_STATE}
        readout={`step ${current.step}/6: at S${current.state}, took "${current.action}", advantage (TD error) = ${current.tdError.toFixed(2)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(script.length - 1, n + 1))}>
          Next step
        </button>
      </div>
      <ContributionBars items={actorBars(current)} readout="the actor: action probabilities at the current state" />
      <ContributionBars items={criticBars(current)} readout="the critic: V(s) for every state" />
    </>
  );
}

/** Play beat: compare the actor and critic before any steps to after all six. */
export function PlayDemo() {
  const script = runActorCritic();
  const first = script[0];
  const final = script[script.length - 1];
  return (
    <>
      <ContributionBars items={actorBars({ ...first, state: 2, actor: first.actor })} readout="π(a | S2) before any updates — uniform, no preference" />
      <ContributionBars items={actorBars({ ...final, state: 2, actor: final.actor })} readout="π(a | S2) after 6 steps — 'right' has pulled ahead" />
      <ContributionBars items={criticBars(final)} readout="the critic's final V(s) estimates" />
    </>
  );
}

/** Checkpoint: step forward until, at state 2, the actor favors "right" with more than half the probability. */
export function ActorCriticCheckpoint() {
  const script = runActorCritic();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = script[i];
  const pi = policyAt(current.actor, 2);
  const passed = current.state === 2 && pi.right > 0.5;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until you're standing at <strong>state 2</strong> and the actor favors <strong>&quot;right&quot;</strong> with more than half the probability.</>}
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
      <ContributionBars items={actorBars(current)} readout={`π(right | S${current.state}) = ${pi.right.toFixed(2)}`} />
    </CheckpointFrame>
  );
}
