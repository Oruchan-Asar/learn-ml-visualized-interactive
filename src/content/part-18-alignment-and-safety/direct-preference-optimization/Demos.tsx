"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { fitDPO, policy, COMPARISONS, ARMS, type Arm } from "@/lib/math-core/direct-preference-optimization";
import { fitRewardModel, trainPolicyFromRewardModel, REWARD_MODEL_STEPS } from "@/lib/math-core/rlhf";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "direct-preference-optimization";
const DPO_TRACE = fitDPO(3);

/** Intuition beat: step through DPO's updates, one preference pair at a time — no reward model in sight. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const theta = DPO_TRACE[step];
  const pi = policy(theta);

  return (
    <>
      <ContributionBars
        items={ARMS.map((a) => ({ label: `π(${a})`, value: pi[a] }))}
        formatValue={(v) => v.toFixed(3)}
        readout={step === 0 ? "before any comparisons" : `after "${COMPARISONS[step - 1][0]} > ${COMPARISONS[step - 1][1]}"`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step >= 3}>
          Apply next comparison
        </button>
        <button type="button" className={styles.button} onClick={() => setStep(0)}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: RLHF's two-stage result versus DPO's one-stage result, from the exact same preference data. */
export function PlayDemo() {
  const rewardTrace = fitRewardModel(REWARD_MODEL_STEPS);
  const { theta: rlhfTheta } = trainPolicyFromRewardModel(rewardTrace[rewardTrace.length - 1]);
  const rlhfPolicy = policy(rlhfTheta);
  const dpoPolicy = policy(DPO_TRACE[DPO_TRACE.length - 1]);

  return (
    <ContributionBars
      items={[
        ...ARMS.map((a) => ({ label: `RLHF π(${a})`, value: rlhfPolicy[a] })),
        ...ARMS.map((a) => ({ label: `DPO π(${a})`, value: dpoPolicy[a] })),
      ]}
      formatValue={(v) => v.toFixed(3)}
      readout="two completely different training loops, the same preference data — both rank B highest, then C, then A"
    />
  );
}

/** Checkpoint: find which arm ends up with the LOWEST preference parameter after DPO training. */
export function DPOCheckpoint() {
  const [chosen, setChosen] = useState<Arm | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const finalTheta = DPO_TRACE[DPO_TRACE.length - 1];
  const minArm = ARMS.reduce((min, a) => (finalTheta[a] < finalTheta[min] ? a : min), ARMS[0]);
  const passed = chosen !== null && chosen === minArm;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the arm, among the three, with the <strong>lowest</strong> preference parameter after DPO training.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an arm to try it"
    >
      <div className={styles.buttons}>
        {ARMS.map((a) => (
          <button
            key={a}
            type="button"
            className={a === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(a);
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: `theta(${chosen})`, value: finalTheta[chosen] }]} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
