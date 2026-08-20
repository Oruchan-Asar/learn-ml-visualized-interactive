"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { X_POINTS, CURVE_DOMAIN, RANGE_DOMAIN, trueFunction, sampleCurve } from "@/lib/math-core/bias-variance";
import { ridgeFit, lassoFit, REG_DEGREE, REG_YS, LAMBDA_MAX } from "@/lib/math-core/regularization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "regularization-l1-vs-l2";

const TRUE_CURVE_POINTS = Array.from({ length: 61 }, (_, i) => {
  const x = CURVE_DOMAIN[0] + ((CURVE_DOMAIN[1] - CURVE_DOMAIN[0]) * i) / 60;
  return { x, y: trueFunction(x) };
});
const SCATTER_POINTS = X_POINTS.map((x, i) => ({ x, y: REG_YS[i] }));

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

function countZeros(coeffs: number[]): number {
  return coeffs.slice(1).filter((c) => c === 0).length;
}

/** Intuition beat: push L1 strength up, watch coefficients disappear one at a time and the curve simplify. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0);
  const coeffs = lassoFit(X_POINTS, REG_YS, REG_DEGREE, lambda);
  const fitCurve: CurveLine = { points: sampleCurve(coeffs, CURVE_DOMAIN), variant: "fitHighlight" };
  return (
    <>
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, fitCurve]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={SCATTER_POINTS}
        readout={`λ = ${lambda.toFixed(2)} — ${countZeros(coeffs)} of 4 coefficients exactly zero`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: switch between L2 and L1 at the same lambda — only one of them ever shows an exact 0.00. */
export function PlayDemo() {
  const [mode, setMode] = useState<"l2" | "l1">("l2");
  const [lambda, setLambda] = useState(0.2);
  const coeffs = mode === "l2" ? ridgeFit(X_POINTS, REG_YS, REG_DEGREE, lambda) : lassoFit(X_POINTS, REG_YS, REG_DEGREE, lambda);
  const fitCurve: CurveLine = { points: sampleCurve(coeffs, CURVE_DOMAIN), variant: "fitHighlight" };
  const coeffText = coeffs.map((c) => c.toFixed(2)).join(", ");

  return (
    <>
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, fitCurve]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={SCATTER_POINTS}
        readout={`coefficients (const, x, x², x³, x⁴) = ${coeffText}`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            type="button"
            className={mode === "l2" ? styles.buttonActive : styles.button}
            onClick={() => setMode("l2")}
          >
            L2 (Ridge)
          </button>
          <button
            type="button"
            className={mode === "l1" ? styles.buttonActive : styles.button}
            onClick={() => setMode("l1")}
          >
            L1 (Lasso)
          </button>
        </div>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Checkpoint: push L1 strength up until both the x¹ and x² terms vanish exactly. */
export function RegularizationCheckpoint() {
  const [lambda, setLambda] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const coeffs = lassoFit(X_POINTS, REG_YS, REG_DEGREE, lambda);
  const fitCurve: CurveLine = { points: sampleCurve(coeffs, CURVE_DOMAIN), variant: "fitHighlight" };

  const passed = coeffs[1] === 0 && coeffs[2] === 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Increase λ (L1) until both the <strong>x¹</strong> and <strong>x²</strong> coefficients drop to exactly
          zero.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the λ slider to try it"
    >
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, fitCurve]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={SCATTER_POINTS}
        readout={`x¹ = ${coeffs[1].toFixed(3)}, x² = ${coeffs[2].toFixed(3)}`}
      />
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
