"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GBM_POINTS,
  GBM_DOMAIN,
  GBM_Y_DOMAIN,
  ROUND2_THRESHOLD,
  DEFAULT_HESSIAN,
  MAX_LAMBDA,
  MAX_HESSIAN,
  xgboostLeafValue,
  sampleXgboostCurve,
} from "@/lib/math-core/modern-boosters-xgboost-and-lightgbm";
import { sampleGbmCurve, GBM_F0, GBM_ROUNDS } from "@/lib/math-core/gradient-boosting-machines";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "modern-boosters-xgboost-and-lightgbm";

const PLAIN_GBM_CURVE: CurveLine = {
  points: sampleGbmCurve(GBM_F0, GBM_ROUNDS, 2, GBM_DOMAIN),
  variant: "fit",
};

function useXgboostAt(lambda: number, hessian: number) {
  return useMemo(() => {
    const leftValue = xgboostLeafValue(ROUND2_THRESHOLD, "left", lambda, hessian);
    const rightValue = xgboostLeafValue(ROUND2_THRESHOLD, "right", lambda, hessian);
    const curve: CurveLine = { points: sampleXgboostCurve(lambda, hessian, GBM_DOMAIN), variant: "fitHighlight" };
    return { leftValue, rightValue, curve };
  }, [lambda, hessian]);
}

function LambdaSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>λ (regularization) = {value.toFixed(1)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={MAX_LAMBDA}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function HessianSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>toy Hessian per point = {value.toFixed(1)}</label>
      <input
        id={id}
        type="range"
        min={0.5}
        max={MAX_HESSIAN}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: drag lambda and watch round 2's second leaf shrink from the plain-GBM curve back toward F1. */
export function IntuitionDemo() {
  const [lambda, setLambda] = useState(0);
  const { curve } = useXgboostAt(lambda, DEFAULT_HESSIAN);
  return (
    <>
      <MultiCurvePlayground
        curves={[PLAIN_GBM_CURVE, curve]}
        scatterPoints={GBM_POINTS}
        domain={GBM_DOMAIN}
        rangeDomain={GBM_Y_DOMAIN}
        readout={`λ = ${lambda.toFixed(1)} — faint curve is plain GBM (λ=0), bold is regularized`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
      </div>
    </>
  );
}

/** Play beat: both lambda and the toy Hessian are live, with the exact leaf values read out. */
export function PlayDemo() {
  const [lambda, setLambda] = useState(0);
  const [hessian, setHessian] = useState(DEFAULT_HESSIAN);
  const { leftValue, rightValue, curve } = useXgboostAt(lambda, hessian);
  return (
    <>
      <MultiCurvePlayground
        curves={[PLAIN_GBM_CURVE, curve]}
        scatterPoints={GBM_POINTS}
        domain={GBM_DOMAIN}
        rangeDomain={GBM_Y_DOMAIN}
        readout={`leaf values: left = ${leftValue.toFixed(3)}, right = ${rightValue.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <LambdaSlider value={lambda} onChange={setLambda} />
        <HessianSlider value={hessian} onChange={setHessian} />
      </div>
    </>
  );
}

const CANDIDATES = [-0.75, -0.6, -0.5, -1 / 3];

/** Checkpoint: at lambda=1 and hessian=2, compute the left leaf's actual Newton value from a set of near-miss decoys. */
export function ModernBoostersCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const target = xgboostLeafValue(ROUND2_THRESHOLD, "left", 1, 2);

  const passed = chosen !== null && Math.abs(chosen - target) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Round 2&rsquo;s left leaf has $G = 3$ over 4 points. With $\lambda = 1$ and a toy Hessian of 2 per
          point, compute $w^* = -G/(H+\lambda)$.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c.toFixed(3)}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
