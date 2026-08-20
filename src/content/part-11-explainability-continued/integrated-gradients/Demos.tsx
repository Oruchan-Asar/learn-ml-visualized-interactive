"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { model, plainSaliency, integratedGradients, completenessGap, outputDelta, BASELINE, INPUT } from "@/lib/math-core/integrated-gradients";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "integrated-gradients";
const STEP_OPTIONS = [1, 10, 500];

const MODEL_CURVE: CurveLine = {
  points: Array.from({ length: 41 }, (_, i) => {
    const x = -2 + (4 * i) / 40;
    return { x, y: model(x) };
  }),
  variant: "fitHighlight",
};

/** Intuition beat: pick a step count and see how far the Riemann-sum approximation lands from the true output change. */
export function IntuitionDemo() {
  const [steps, setSteps] = useState(10);
  const ig = integratedGradients(steps);
  const delta = outputDelta();
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === steps ? styles.buttonActive : styles.button} onClick={() => setSteps(n)}>
            {n} steps
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "integrated gradients", value: ig },
          { label: "true output change", value: delta },
        ]}
        formatValue={(v) => v.toFixed(4)}
        readout={`gap from the true output change: ${completenessGap(steps).toFixed(4)}`}
      />
    </>
  );
}

/** Play beat: the model curve itself — flat at both ends (saturated), steep only in the middle. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[MODEL_CURVE]}
      domain={[-2, 2]}
      rangeDomain={[0, 1]}
      scatterPoints={[
        { x: BASELINE, y: model(BASELINE) },
        { x: INPUT, y: model(INPUT) },
      ]}
      readout={`baseline (x=0) → input (x=2): the path crosses the steep middle, even though the plain gradient AT x=2 is only ${plainSaliency().toFixed(5)}`}
    />
  );
}

/** Checkpoint: find the step count where integrated gradients gets within 0.05 of the true output change. */
export function IntegratedGradientsCheckpoint() {
  const [steps, setSteps] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const gap = steps === null ? null : completenessGap(steps);
  const passed = gap !== null && gap < 0.05;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the step count, among the three candidates, where integrated gradients lands within <strong>0.05</strong> of the true output change.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a step count to try it"
    >
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={n === steps ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setSteps(n);
            }}
          >
            {n} steps
          </button>
        ))}
      </div>
      {gap !== null && <ContributionBars items={[{ label: "gap from true delta", value: gap }]} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
