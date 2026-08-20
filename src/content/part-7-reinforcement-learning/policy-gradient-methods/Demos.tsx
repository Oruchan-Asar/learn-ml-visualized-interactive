"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ARMS, policy, runPolicyGradient, THETA_INIT, type Preferences } from "@/lib/math-core/policy-gradient-methods";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "policy-gradient-methods";

function policyBars(theta: Preferences) {
  const pi = policy(theta);
  return ARMS.map((a) => ({ label: `π(${a})`, value: pi[a] }));
}

/** Intuition beat: step through 5 pulls, watching the policy's own probabilities shift after each one. */
export function IntuitionDemo() {
  const script = runPolicyGradient();
  const [i, setI] = useState(0);
  const current = script[i];

  return (
    <>
      <ContributionBars
        items={policyBars(current.thetaAfter)}
        readout={`step ${current.step}/5: pulled ${current.arm}, reward ${current.reward}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous step
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(script.length - 1, n + 1))}>
          Next step
        </button>
      </div>
    </>
  );
}

/** Play beat: compare the starting uniform policy to the fully updated one after all 5 pulls. */
export function PlayDemo() {
  const script = runPolicyGradient();
  const final = script[script.length - 1].thetaAfter;
  return (
    <>
      <ContributionBars items={policyBars(THETA_INIT)} readout="before any pulls — uniform, no preference at all" />
      <ContributionBars items={policyBars(final)} readout="after 5 pulls — B has pulled clearly ahead" />
    </>
  );
}

/** Checkpoint: step forward until the policy favors arm B with more than half the probability. */
export function PolicyGradientCheckpoint() {
  const script = runPolicyGradient();
  const [i, setI] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const current = script[i];
  const pi = policy(current.thetaAfter);
  const passed = pi.B > 0.5;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Step forward until the policy gives arm B more than <strong>half</strong> the probability mass.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Step forward to try it"
    >
      <ContributionBars items={policyBars(current.thetaAfter)} readout={`step ${current.step}/5 — π(B) = ${pi.B.toFixed(2)}`} />
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
    </CheckpointFrame>
  );
}
