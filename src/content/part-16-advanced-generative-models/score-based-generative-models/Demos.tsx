"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { score, langevinStep, MU, START_X, CHECKPOINT_STEPS, distanceToModeAfter } from "@/lib/math-core/score-based-generative-models";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "score-based-generative-models";

function useTrajectorySteps() {
  const [points, setPoints] = useState<number[]>([START_X]);

  const stepForward = () => setPoints((prev) => [...prev, langevinStep(prev[prev.length - 1])]);
  const reset = () => setPoints([START_X]);

  const t = points.length - 1;
  return { t, points, stepForward, reset };
}

/** Intuition beat: step a point forward along the score field, uphill toward the mode, one Langevin update at a time. */
export function IntuitionDemo() {
  const { t, points, stepForward, reset } = useTrajectorySteps();
  const curve: CurveLine = { points: points.map((x, i) => ({ x: i, y: x })), variant: "fitHighlight" };

  return (
    <>
      <MultiCurvePlayground
        curves={[curve]}
        domain={[0, 12]}
        rangeDomain={[-6, 4]}
        scatterPoints={[{ x: t, y: points[t] }]}
        readout={`step ${t}: x = ${points[t].toFixed(4)}, score(x) = ${score(points[t]).toFixed(4)}, distance to mode = ${Math.abs(points[t] - MU).toFixed(4)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={stepForward} disabled={t >= 12}>
          Take a Langevin step
        </button>
        <button type="button" className={styles.button} onClick={reset}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: the exact closed-form distance to the mode, at every candidate step count — no need to simulate to know it. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={CHECKPOINT_STEPS.map((steps) => ({ label: `step ${steps}`, value: distanceToModeAfter(START_X, steps) }))}
      formatValue={(v) => v.toFixed(4)}
      readout="distance to the mode shrinks by exactly 0.7x per step, regardless of how far the starting point was"
    />
  );
}

/** Checkpoint: find the smallest step count, among the candidates, where the trajectory lands within 0.5 of the mode. */
export function ScoreCheckpoint() {
  const [chosenSteps, setChosenSteps] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const smallestQualifying = CHECKPOINT_STEPS.find((steps) => distanceToModeAfter(START_X, steps) < 0.5);
  const chosenDistance = chosenSteps === null ? null : distanceToModeAfter(START_X, chosenSteps);
  const passed = chosenSteps !== null && chosenSteps === smallestQualifying;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>smallest</strong> step count, among the candidates, where the trajectory lands within <strong>0.5</strong> of the mode.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a step count to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_STEPS.map((steps) => (
          <button
            key={steps}
            type="button"
            className={steps === chosenSteps ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenSteps(steps);
            }}
          >
            {steps} steps
          </button>
        ))}
      </div>
      {chosenDistance !== null && <ContributionBars items={[{ label: "distance to mode", value: chosenDistance }]} formatValue={(v) => v.toFixed(4)} max={distanceToModeAfter(START_X, CHECKPOINT_STEPS[0])} />}
    </CheckpointFrame>
  );
}
