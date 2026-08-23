"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { lassoFit, LAMBDA_MAX } from "@/lib/math-core/lasso-regression-l1";
import { ridgeFit } from "@/lib/math-core/ridge-regression-l2";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "lasso-regression-l1";
const BAR_MAX = 4;

function weightItems(w: { w1: number; w2: number }) {
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

/** Intuition beat: push λ up on the same collinear pair from the ridge chapter — one weight snaps to exactly 0. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0);
  const w = lassoFit(lambda);
  return (
    <>
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(3)}
        readout={w.w2 === 0 ? "w₂ = 0.000 exactly — not rounding, the fitted value" : "both weights still nonzero"}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: same λ fed to both lasso and ridge — only lasso ever produces a flat, exact 0.00. */
export function PlayDemo() {
  const [lambda, setLambda] = useState(0.3);
  const lasso = lassoFit(lambda);
  const ridge = ridgeFit(lambda);
  return (
    <>
      <ContributionBars items={weightItems(lasso)} max={BAR_MAX} formatValue={(v) => v.toFixed(3)} readout="lasso (L1)" />
      <ContributionBars items={weightItems(ridge)} max={BAR_MAX} formatValue={(v) => v.toFixed(3)} readout="ridge (L2), same λ" />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Checkpoint: find a λ that zeroes w2 exactly while keeping w1 comfortably nonzero. */
export function LassoCheckpoint() {
  const [lambda, setLambda] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const w = lassoFit(lambda);
  const passed = w.w2 === 0 && w.w1 > 1;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Increase λ until <strong>w₂</strong> drops to exactly zero.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the λ slider to try it"
    >
      <ContributionBars
        items={weightItems(w)}
        max={BAR_MAX}
        formatValue={(v) => v.toFixed(3)}
        readout={`w₁ = ${w.w1.toFixed(3)}, w₂ = ${w.w2.toFixed(3)}`}
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
