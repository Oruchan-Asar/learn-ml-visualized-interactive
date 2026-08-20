"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { train, mse, X1, X2, X2_SCALED, Y, TRUE_W1, TRUE_W2 } from "@/lib/math-core/feature-engineering-and-scaling";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "feature-engineering-and-scaling";
const STEPS = 20;
const CANDIDATE_RATES = [0.00005, 0.0001, 0.001];

function distanceCurves(learningRate: number, steps: number = STEPS): { w1: CurveLine; w2: CurveLine } {
  const trace = train(learningRate, steps, X1, X2, Y);
  return {
    w1: { points: trace.map((w, i) => ({ x: i, y: Math.abs(TRUE_W1 - w.w1) })), variant: "fitHighlight" },
    w2: { points: trace.map((w, i) => ({ x: i, y: Math.abs(TRUE_W2 - w.w2) })), variant: "fit" },
  };
}

/** Intuition beat: one shared learning rate, two features on wildly different scales, two very different fates. */
export function IntuitionDemo() {
  const [lr, setLr] = useState(0.00005);
  const { w1, w2 } = distanceCurves(lr);
  const yMax = Math.max(1e-6, ...w1.points.map((p) => p.y), ...w2.points.map((p) => p.y));
  return (
    <>
      <div className={styles.buttons}>
        {CANDIDATE_RATES.map((rate) => (
          <button key={rate} type="button" className={rate === lr ? styles.buttonActive : styles.button} onClick={() => setLr(rate)}>
            lr={rate}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[w1, w2]}
        domain={[0, STEPS]}
        rangeDomain={[0, yMax]}
        readout="bold: distance from true w1 (tiny-scale feature) — faint: distance from true w2 (huge-scale feature)"
      />
    </>
  );
}

/** Play beat: same weights, same data, only x2 rescaled to x1's range — one moderate rate now converges both. */
export function PlayDemo() {
  const rawFinal = train(0.00005, STEPS, X1, X2, Y).at(-1)!;
  const scaledFinal = train(0.5, 2, X1, X2_SCALED, Y).at(-1)!;
  return (
    <ContributionBars
      items={[
        { label: "raw: w1 error (20 steps)", value: TRUE_W1 - rawFinal.w1 },
        { label: "raw: w2 error (20 steps)", value: TRUE_W2 - rawFinal.w2 },
        { label: "scaled: w1 error (2 steps)", value: TRUE_W1 - scaledFinal.w1 },
        { label: "scaled: w2 error (2 steps)", value: TRUE_W2 * 100 - scaledFinal.w2 },
      ]}
      formatValue={(v) => v.toFixed(4)}
      readout="scaling both features to the same range lets one learning rate solve both weights exactly"
    />
  );
}

/** Checkpoint: find the learning rate that leaves w1 more than 2 away from its true value after 20 steps. */
export function FeatureScalingCheckpoint() {
  const [lr, setLr] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const final = lr === null ? null : train(lr, STEPS, X1, X2, Y).at(-1)!;
  const w1Error = final ? Math.abs(TRUE_W1 - final.w1) : null;
  const passed = w1Error !== null && w1Error > 2;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the learning rate that&apos;s <strong>safe for w2</strong> but leaves <strong>w1 more than 2 away</strong> from its true value after the same 20 steps.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a learning rate to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATE_RATES.map((rate) => (
          <button
            key={rate}
            type="button"
            className={rate === lr ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setLr(rate);
            }}
          >
            lr={rate}
          </button>
        ))}
      </div>
      {final && (
        <ContributionBars
          items={[
            { label: "w1 error", value: TRUE_W1 - final.w1 },
            { label: "w2 error", value: TRUE_W2 - final.w2 },
          ]}
          formatValue={(v) => v.toFixed(4)}
          readout={`MSE = ${mse(final, X1, X2, Y).toFixed(4)}`}
        />
      )}
    </CheckpointFrame>
  );
}
