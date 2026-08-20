"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ARMS, pullArm, estimate, bestArm, runScript, type Arm } from "@/lib/math-core/multi-armed-bandits";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "multi-armed-bandits";

function emptyRewards(): Record<Arm, number[]> {
  return { A: [], B: [], C: [] };
}

function barsFor(rewards: Record<Arm, number[]>) {
  return ARMS.map((a) => ({ label: `Arm ${a} (${rewards[a].length} pulls)`, value: estimate(rewards[a]) }));
}

/** Intuition beat: pull any arm by hand, watch its running-average estimate update. */
export function IntuitionDemo() {
  const [rewards, setRewards] = useState(emptyRewards());

  const pull = (arm: Arm) => setRewards((prev) => ({ ...prev, [arm]: [...prev[arm], pullArm(arm, prev[arm].length)] }));

  return (
    <>
      <div className={styles.buttons}>
        {ARMS.map((a) => (
          <button type="button" key={a} className={styles.button} onClick={() => pull(a)}>
            Pull arm {a}
          </button>
        ))}
      </div>
      <ContributionBars items={barsFor(rewards)} readout="each bar is that arm's running-average reward so far" />
    </>
  );
}

/** Play beat: step through a fixed 8-step epsilon-greedy script, one decision at a time. */
export function PlayDemo() {
  const script = runScript();
  const [stepIndex, setStepIndex] = useState(0);
  const current = script[stepIndex];

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setStepIndex((i) => Math.min(script.length - 1, i + 1))}>
          Next step
        </button>
      </div>
      <ContributionBars
        items={barsFor(current.rewardsByArm)}
        readout={`step ${current.step}/8: ${current.action} → pulled arm ${current.arm}, reward ${current.reward}`}
      />
    </>
  );
}

/** Checkpoint: pull arms by hand until you've found (and confirmed, with at least 3 pulls) an arm averaging above 0.7. */
export function BanditsCheckpoint() {
  const [rewards, setRewards] = useState(emptyRewards());
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = ARMS.some((a) => rewards[a].length >= 3 && estimate(rewards[a]) > 0.7);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const pull = (arm: Arm) => {
    setHasInteracted(true);
    setRewards((prev) => ({ ...prev, [arm]: [...prev[arm], pullArm(arm, prev[arm].length)] }));
  };

  return (
    <CheckpointFrame
      instructions={<>Pull arms until one arm&apos;s estimate exceeds <strong>0.7</strong>, backed by at least <strong>3 pulls</strong> of it.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pull an arm to try it"
    >
      <div className={styles.buttons}>
        {ARMS.map((a) => (
          <button type="button" key={a} className={styles.button} onClick={() => pull(a)}>
            Pull arm {a}
          </button>
        ))}
      </div>
      <ContributionBars items={barsFor(rewards)} readout={`current best estimate: arm ${bestArm(rewards)}`} />
    </CheckpointFrame>
  );
}
