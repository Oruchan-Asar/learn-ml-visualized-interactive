"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ridgeFit, sse, CORRELATION, LAMBDA_MAX, type Weights } from "@/lib/math-core/ridge-regression-l2";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "ridge-regression-l2";
const BAR_MAX = 4;

function weightItems(w: Weights) {
  return [
    { label: "w₁ (predictor 1)", value: w.w1 },
    { label: "w₂ (predictor 2)", value: w.w2 },
  ];
}

function LambdaSlider({ value, onChange }: { value: number; onChange: (lambda: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>λ = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={LAMBDA_MAX}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: push λ up and watch the two weights swap from opposite-signed and unstable to positive and balanced. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0);
  const w = ridgeFit(lambda);
  const unstable = w.w1 * w.w2 < 0;
  return (
    <>
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        readout={
          unstable
            ? `correlation ≈ ${CORRELATION.toFixed(3)} — yet opposite signs: an unstable fit`
            : `correlation ≈ ${CORRELATION.toFixed(3)} — both weights positive: a sane split of credit`
        }
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: same slider, now also tracking SSE — the fit barely changes even as the weights move a lot. */
export function PlayDemo() {
  const [lambda, setLambda] = useState(1);
  const w = ridgeFit(lambda);
  const fitError = sse(w);
  const olsError = sse(ridgeFit(0));
  return (
    <>
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        readout={`SSE = ${fitError.toFixed(3)} (unregularized OLS: ${olsError.toFixed(3)})`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Checkpoint: increase λ until both weights are positive — fixing the collinearity sign-flip. */
export function RidgeCheckpoint() {
  const [lambda, setLambda] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const w = ridgeFit(lambda);
  const passed = w.w1 > 0 && w.w2 > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Increase λ until <strong>both</strong> weights are positive — undoing the sign flip caused by the two
          nearly-identical predictors.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the λ slider to try it"
    >
      <ContributionBars items={weightItems(w)} max={BAR_MAX} readout={`w₁ = ${w.w1.toFixed(3)}, w₂ = ${w.w2.toFixed(3)}`} />
      <div className={styles.controls}>
        <LambdaSlider
          value={lambda}
          onChange={(l) => {
            setHasInteracted(true);
            setLambda(l);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
