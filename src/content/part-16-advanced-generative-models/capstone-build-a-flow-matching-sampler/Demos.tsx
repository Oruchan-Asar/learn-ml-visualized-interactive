"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TRAINING_PAIRS, pairVelocity, trainVelocityField, generate, TEST_NOISE_POINTS, TARGET_VALUE } from "@/lib/math-core/capstone-build-a-flow-matching-sampler";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-build-a-flow-matching-sampler";
const TRAINED_V = trainVelocityField();

/** Intuition beat: step a fresh noise point (never seen in training) forward through the trained field. */
export function IntuitionDemo() {
  const [noiseIndex, setNoiseIndex] = useState(1);
  const x0 = TEST_NOISE_POINTS[noiseIndex];
  const [steps, setSteps] = useState(0);
  const MAX_STEPS = 10;
  const dt = 1 / MAX_STEPS;
  const trace = Array.from({ length: steps + 1 }, (_, i) => ({ x: i * dt, y: x0 + TRAINED_V * dt * i }));
  const traceCurve: CurveLine = { points: trace, variant: "fitHighlight" };

  return (
    <>
      <div className={styles.buttons}>
        {TEST_NOISE_POINTS.map((x, i) => (
          <button key={x} type="button" className={i === noiseIndex ? styles.buttonActive : styles.button} onClick={() => { setNoiseIndex(i); setSteps(0); }}>
            x0 = {x}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[traceCurve]}
        domain={[0, 1]}
        rangeDomain={[-6, 14]}
        scatterPoints={[{ x: steps / MAX_STEPS, y: trace[trace.length - 1].y }]}
        readout={`step ${steps}/${MAX_STEPS}: x = ${trace[trace.length - 1].y.toFixed(3)} (trained v̄ = ${TRAINED_V.toFixed(2)})`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.buttonActive} onClick={() => setSteps((s) => Math.min(MAX_STEPS, s + 1))} disabled={steps >= MAX_STEPS}>
          Take one Euler step
        </button>
        <button type="button" className={styles.button} onClick={() => setSteps(0)}>
          Reset
        </button>
      </div>
    </>
  );
}

/** Play beat: the training pairs' individual velocities versus the single trained field that averages them. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={[...TRAINING_PAIRS.map((p, i) => ({ label: `pair ${i} velocity`, value: pairVelocity(p) })), { label: "trained v̄ (mean)", value: TRAINED_V }]}
      formatValue={(v) => v.toFixed(2)}
      readout="the trained field doesn't match any single pair exactly — it's the least-squares average across all of them"
    />
  );
}

/** Checkpoint: find the test noise point whose generated sample lands closest to the target value of 7. */
export function SamplerCheckpoint() {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const distances = TEST_NOISE_POINTS.map((x0) => Math.abs(generate(x0, TRAINED_V, 10) - TARGET_VALUE));
  const minDistance = Math.min(...distances);
  const chosenDistance = chosenIndex === null ? null : distances[chosenIndex];
  const passed = chosenDistance !== null && chosenDistance === minDistance;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the noise point, among the four candidates, whose generated sample lands <strong>closest</strong> to the target value of {TARGET_VALUE}.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a noise point to try it"
    >
      <div className={styles.buttons}>
        {TEST_NOISE_POINTS.map((x, i) => (
          <button
            key={x}
            type="button"
            className={i === chosenIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosenIndex(i);
            }}
          >
            x0 = {x}
          </button>
        ))}
      </div>
      {chosenDistance !== null && <ContributionBars items={[{ label: "distance to target", value: chosenDistance }]} formatValue={(v) => v.toFixed(3)} max={Math.max(...distances)} />}
    </CheckpointFrame>
  );
}
