"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { CAPSTONE_PROBLEM, CAPSTONE_ANSWER, CAPSTONE_GROUP, verify, trainStep } from "@/lib/math-core/capstone-train-a-reasoning-model-grpo";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-train-a-reasoning-model-grpo";
const RESULT = trainStep();

/** Intuition beat: step through the 5 sampled responses, verifying each one exactly -- RLVR's mechanism, unchanged. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const sample = CAPSTONE_GROUP[i];
  const correct = verify(sample.answer, CAPSTONE_ANSWER);

  return (
    <>
      <p>
        {CAPSTONE_PROBLEM} (correct answer: {CAPSTONE_ANSWER})
      </p>
      <ContributionBars
        items={[{ label: `response ${sample.id}: "${sample.answer}"`, value: RESULT.rewards[i] }]}
        formatValue={(v) => v.toFixed(0)}
        max={1}
        readout={correct ? "verified correct — reward = 1" : "verified WRONG — reward = 0"}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous response
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(CAPSTONE_GROUP.length - 1, n + 1))}>
          Next response
        </button>
      </div>
    </>
  );
}

/** Play beat: the same group's rewards and GRPO advantages, side by side -- two chapters' machinery, one set of samples. */
export function PlayDemo() {
  return (
    <>
      <ContributionBars
        items={CAPSTONE_GROUP.map((s, i) => ({ label: `response ${s.id}: "${s.answer}"`, value: RESULT.rewards[i] }))}
        formatValue={(v) => v.toFixed(0)}
        max={1}
        readout={`RLVR's verifiable rewards — mean ${RESULT.mean.toFixed(1)}, std ${RESULT.std.toFixed(1)}`}
      />
      <ContributionBars
        items={CAPSTONE_GROUP.map((s, i) => ({ label: `response ${s.id}: "${s.answer}"`, value: RESULT.advantages[i] }))}
        formatValue={(v) => v.toFixed(1)}
        max={2}
        readout="GRPO's group-relative advantages — no reward model, no critic network, computed from these 5 rewards alone"
      />
    </>
  );
}

/** Checkpoint: find the one response the verifier marks WRONG -- the one that ends up with the most negative advantage. */
export function GrpoReasoningCheckpoint() {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const chosenIndex = CAPSTONE_GROUP.findIndex((s) => s.id === chosenId);
  const chosenAdvantage = chosenIndex === -1 ? null : RESULT.advantages[chosenIndex];
  const minAdvantage = Math.min(...RESULT.advantages);
  const passed = chosenAdvantage !== null && withinTolerance(chosenAdvantage, minAdvantage, 1e-6);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the response the verifier marks <strong>wrong</strong> -- the one with the most negative GRPO advantage.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a response to try it"
    >
      <div className={styles.buttons}>
        {CAPSTONE_GROUP.map((s) => (
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
      {chosenAdvantage !== null && (
        <ContributionBars items={[{ label: `response ${chosenId}`, value: chosenAdvantage }]} formatValue={(v) => v.toFixed(2)} max={2} />
      )}
    </CheckpointFrame>
  );
}
