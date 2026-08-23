"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PROBLEM, CORRECT_ANSWER, SAMPLES, verify, verifiableReward, meanReward, bestByVerifier, bestByLearnedReward } from "@/lib/math-core/reinforcement-learning-with-verifiable-rewards-rlvr";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "reinforcement-learning-with-verifiable-rewards-rlvr";

/** Intuition beat: step through the 4 sampled responses, verifying each one exactly, live. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const sample = SAMPLES[i];
  const correct = verify(sample.answer);

  return (
    <>
      <p>
        {PROBLEM} (correct answer: {CORRECT_ANSWER})
      </p>
      <ContributionBars
        items={[{ label: `response ${sample.id}: "${sample.answer}"`, value: verifiableReward(sample) }]}
        formatValue={(v) => v.toFixed(0)}
        max={1}
        readout={correct ? "verified correct — reward = 1" : "verified WRONG — reward = 0"}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous response
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(SAMPLES.length - 1, n + 1))}>
          Next response
        </button>
      </div>
    </>
  );
}

/** Play beat: the exact-match verifier's rewards vs. a hypothetical learned reward model's guesses, on the SAME 4 responses. */
export function PlayDemo() {
  const verifierBest = bestByVerifier();
  const learnedBest = bestByLearnedReward();

  return (
    <>
      <ContributionBars
        items={SAMPLES.map((s) => ({ label: `"${s.answer}" — verifiable`, value: verifiableReward(s) }))}
        formatValue={(v) => v.toFixed(0)}
        max={1}
        readout={`mean verifiable reward = ${meanReward(SAMPLES.map((s) => verifiableReward(s))).toFixed(3)}`}
      />
      <ContributionBars
        items={SAMPLES.map((s) => ({ label: `"${s.answer}" — learned RM guess`, value: s.learnedRewardGuess }))}
        formatValue={(v) => v.toFixed(2)}
        max={1}
        readout={`mean learned-RM reward = ${meanReward(SAMPLES.map((s) => s.learnedRewardGuess)).toFixed(3)} — similar on AVERAGE, but the verifier picks "${verifierBest.answer}" while the learned RM picks "${learnedBest.answer}" — a WRONG answer`}
      />
    </>
  );
}

/** Checkpoint: find a response the ground-truth verifier marks correct — reward exactly 1, not merely the learned RM's favorite. */
export function RlvrCheckpoint() {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosen = chosenId === null ? null : SAMPLES.find((s) => s.id === chosenId) ?? null;
  const passed = chosen !== null && verifiableReward(chosen) === 1;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick a response the <strong>verifier</strong> (not the learned reward model) marks correct.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a response to try it"
    >
      <div className={styles.buttons}>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === chosenId ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenId(s.id);
            }}
          >
            &quot;{s.answer}&quot;
          </button>
        ))}
      </div>
      {chosenId !== null && (
        <p>
          verifiable reward = {verifiableReward(SAMPLES.find((s) => s.id === chosenId)!)}, learned RM guess ={" "}
          {SAMPLES.find((s) => s.id === chosenId)!.learnedRewardGuess.toFixed(2)}
        </p>
      )}
    </CheckpointFrame>
  );
}
