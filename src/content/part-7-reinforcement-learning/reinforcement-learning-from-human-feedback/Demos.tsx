"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ARMS, policy, fitRewardModel, trainPolicyFromRewardModel, REWARD_MODEL_STEPS, type Arm } from "@/lib/math-core/rlhf";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "reinforcement-learning-from-human-feedback";

function rewardBars(rewards: Record<Arm, number>) {
  return ARMS.map((a) => ({ label: `reward(${a})`, value: rewards[a] }));
}

/** Intuition beat: step through fitting a reward model from nothing but "this one's better" comparisons. */
export function IntuitionDemo() {
  const trace = fitRewardModel(REWARD_MODEL_STEPS);
  const [i, setI] = useState(0);
  const rewards = trace[i];

  return (
    <>
      <ContributionBars items={rewardBars(rewards)} readout={`fitting step ${i}/${REWARD_MODEL_STEPS} — reward(A) fixed at 0 as the reference`} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(trace.length - 1, n + 1))}>
          Next step
        </button>
      </div>
    </>
  );
}

/** Play beat: compare the policy before and after training on the fitted reward model. */
export function PlayDemo() {
  const trace = fitRewardModel(REWARD_MODEL_STEPS);
  const final = trace[trace.length - 1];
  const { theta, policyBefore } = trainPolicyFromRewardModel(final);
  const after = policy(theta);
  return (
    <>
      <ContributionBars items={ARMS.map((a) => ({ label: `π(${a})`, value: policyBefore[a] }))} readout="before training on the reward model — uniform" />
      <ContributionBars items={ARMS.map((a) => ({ label: `π(${a})`, value: after[a] }))} readout="after — the policy now favors the response humans preferred" />
    </>
  );
}

/** Checkpoint: fit the reward model until B's fitted reward passes 1.0. */
export function RlhfCheckpoint() {
  const trace = fitRewardModel(REWARD_MODEL_STEPS);
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const rewards = trace[i];
  const passed = rewards.B > 1.0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Fit the reward model until response B&apos;s reward passes <strong>1.0</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <ContributionBars items={rewardBars(rewards)} readout={`step ${i}/${REWARD_MODEL_STEPS} — reward(B) = ${rewards.B.toFixed(2)}`} />
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
      </div>
    </CheckpointFrame>
  );
}
