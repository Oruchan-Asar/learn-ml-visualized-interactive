"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { BASE_ACCURACY, STAGES, STAGE_ACCURACY, accuracyBeforeStage, stageGain, type Stage } from "@/lib/math-core/the-modern-llm-post-training-pipeline";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "the-modern-llm-post-training-pipeline";

/** Intuition beat: step through the pipeline one stage at a time — "step N of M" — watching accuracy accumulate. */
export function IntuitionDemo() {
  const [stepIndex, setStepIndex] = useState(0); // 0 = base model, 1..STAGES.length = after that stage
  const currentAccuracy = stepIndex === 0 ? BASE_ACCURACY : STAGE_ACCURACY[STAGES[stepIndex - 1]];
  const label = stepIndex === 0 ? "Pretrained (base model)" : STAGES[stepIndex - 1];

  return (
    <>
      <ContributionBars
        items={[{ label, value: currentAccuracy }]}
        formatValue={(v) => v.toFixed(2)}
        max={1}
        readout={`step ${stepIndex} of ${STAGES.length} — benchmark accuracy = ${currentAccuracy.toFixed(2)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setStepIndex((s) => Math.max(0, s - 1))}>
          Previous stage
        </button>
        <button type="button" className={styles.button} onClick={() => setStepIndex((s) => Math.min(STAGES.length, s + 1))}>
          Next stage
        </button>
      </div>
    </>
  );
}

/** Play beat: every stage's own marginal contribution, side by side — none of them do the same job. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={STAGES.map((stage, i) => ({ label: `${stage} gain`, value: stageGain(i) }))}
      formatValue={(v) => `+${v.toFixed(2)}`}
      max={0.3}
      readout={`base model: ${BASE_ACCURACY.toFixed(2)} → final: ${STAGE_ACCURACY[STAGES[STAGES.length - 1]].toFixed(2)}`}
    />
  );
}

/** Checkpoint: find the stage whose OWN marginal gain is the largest of the three. */
export function PostTrainingPipelineCheckpoint() {
  const [chosen, setChosen] = useState<Stage | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const gains = STAGES.map((stage, i) => ({ stage, gain: stageGain(i) }));
  const trueLargest = gains.reduce((best, g) => (g.gain > best.gain ? g : best), gains[0]).stage;
  const chosenGain = chosen === null ? null : stageGain(STAGES.indexOf(chosen));
  const trueGain = stageGain(STAGES.indexOf(trueLargest));
  const passed = chosen !== null && chosenGain !== null && withinTolerance(chosenGain, trueGain, 1e-9) && chosen === trueLargest;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the stage whose <strong>own</strong> marginal accuracy gain is the largest of the three.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a stage to try it"
    >
      <div className={styles.buttons}>
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className={stage === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(stage);
            }}
          >
            {stage}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <ContributionBars
          items={[
            { label: `accuracy before ${chosen}`, value: accuracyBeforeStage(STAGES.indexOf(chosen)) },
            { label: `accuracy after ${chosen}`, value: STAGE_ACCURACY[chosen] },
          ]}
          formatValue={(v) => v.toFixed(2)}
          max={1}
        />
      )}
    </CheckpointFrame>
  );
}
