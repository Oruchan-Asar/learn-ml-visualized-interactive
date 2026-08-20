"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  X_POINTS,
  CURVE_DOMAIN,
  RANGE_DOMAIN,
  MAX_DEGREE,
  trueFunction,
  polyFit,
  sampleCurve,
  noisyYs,
  fitAllDatasets,
  biasVarianceAtDegree,
} from "@/lib/math-core/bias-variance";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "bias-variance-tradeoff";
const TOLERANCE = 0.01;

const TOTALS_BY_DEGREE = Array.from({ length: MAX_DEGREE + 1 }, (_, d) => biasVarianceAtDegree(d).total);
const BEST_TOTAL = Math.min(...TOTALS_BY_DEGREE);

const TRUE_CURVE_POINTS = Array.from({ length: 61 }, (_, i) => {
  const x = CURVE_DOMAIN[0] + ((CURVE_DOMAIN[1] - CURVE_DOMAIN[0]) * i) / 60;
  return { x, y: trueFunction(x) };
});

function DegreeSlider({ value, onChange }: { value: number; onChange: (degree: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>degree = {value}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={MAX_DEGREE}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: one noisy dataset, one fit — watch it go from too-stiff to wildly overfit as degree grows. */
export function IntuitionDemo() {
  const [degree, setDegree] = useState(0);
  const coeffs = useMemo(() => polyFit(X_POINTS, noisyYs(0), degree), [degree]);
  const fitPoints = useMemo(() => sampleCurve(coeffs, CURVE_DOMAIN), [coeffs]);
  const scatterPoints = X_POINTS.map((x, i) => ({ x, y: noisyYs(0)[i] }));

  return (
    <>
      <MultiCurvePlayground
        curves={[
          { points: TRUE_CURVE_POINTS, variant: "true" },
          { points: fitPoints, variant: "fitHighlight" },
        ]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={scatterPoints}
        readout={`Degree ${degree} fit to one noisy sample (dashed = the true curve)`}
      />
      <div className={styles.controls}>
        <DegreeSlider value={degree} onChange={setDegree} />
      </div>
    </>
  );
}

/** Play beat: all 6 resampled fits at once — the spread between them *is* the variance. */
export function PlayDemo() {
  const [degree, setDegree] = useState(0);
  const { biasSquared, variance } = biasVarianceAtDegree(degree);
  const fitCurves: CurveLine[] = fitAllDatasets(degree).map((coeffs) => ({
    points: sampleCurve(coeffs, CURVE_DOMAIN),
    variant: "fit",
  }));

  return (
    <>
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, ...fitCurves]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        readout={`Degree ${degree} — bias² = ${biasSquared.toFixed(3)}, variance = ${variance.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <DegreeSlider value={degree} onChange={setDegree} />
      </div>
    </>
  );
}

/** Checkpoint: find the degree that minimizes total error — neither the stiffest nor the most flexible model. */
export function BiasVarianceCheckpoint() {
  const [degree, setDegree] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { biasSquared, variance, total } = biasVarianceAtDegree(degree);
  const fitCurves: CurveLine[] = fitAllDatasets(degree).map((coeffs) => ({
    points: sampleCurve(coeffs, CURVE_DOMAIN),
    variant: "fit",
  }));

  const passed = withinTolerance(total, BEST_TOTAL, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find the degree that minimizes <strong>total error</strong> (bias² + variance) — neither the stiffest nor
          the most flexible model wins.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the degree slider to try it"
    >
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, ...fitCurves]}
        domain={CURVE_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        readout={`Degree ${degree} — bias² = ${biasSquared.toFixed(3)}, variance = ${variance.toFixed(3)}, total = ${total.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <DegreeSlider
          value={degree}
          onChange={(d) => {
            setHasInteracted(true);
            setDegree(d);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
