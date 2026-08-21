"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { flowForward, flowDerivative, transformedDensity, BASE_DENSITY, CHECKPOINT_CANDIDATES } from "@/lib/math-core/normalizing-flows";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "normalizing-flows";
const MIN_X_FOR_CURVE = 0.02;

const DENSITY_CURVE: CurveLine = {
  points: Array.from({ length: 100 }, (_, i) => {
    const x = MIN_X_FOR_CURVE + ((1 - MIN_X_FOR_CURVE) * i) / 99;
    return { x, y: transformedDensity(x) };
  }),
  variant: "fitHighlight",
};
const BASE_CURVE: CurveLine = {
  points: [
    { x: 0, y: BASE_DENSITY },
    { x: 1, y: BASE_DENSITY },
  ],
  variant: "true",
};

/** Intuition beat: drag z and watch where it lands as x = z², and how the local stretch changes the density there. */
export function IntuitionDemo() {
  const [z, setZ] = useState(0.5);
  const x = flowForward(z);
  const stretch = flowDerivative(z);
  const density = transformedDensity(x);

  return (
    <>
      <MultiCurvePlayground curves={[DENSITY_CURVE]} domain={[0, 1]} rangeDomain={[0, 6]} scatterPoints={[{ x, y: density }]} readout={`z = ${z.toFixed(2)} → x = ${x.toFixed(3)}, stretch |df/dz| = ${stretch.toFixed(2)}, density = ${density.toFixed(3)}`} />
      <label className={styles.sliderRow}>
        z
        <input type="range" min={0.05} max={1} step={0.01} value={z} onChange={(e) => setZ(Number(e.target.value))} />
        {z.toFixed(2)}
      </label>
    </>
  );
}

/** Play beat: the flat base density and the warped result, on the same axes — the whole shape change caused by one invertible function. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[BASE_CURVE, DENSITY_CURVE]}
      domain={[0, 1]}
      rangeDomain={[0, 6]}
      readout="dashed: Z ~ Uniform(0,1), flat everywhere. Bold: X = Z², concentrated near 0 — same probability mass, redistributed by the flow"
    />
  );
}

/** Checkpoint: find the candidate x with the HIGHEST transformed density. */
export function FlowCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const densities = CHECKPOINT_CANDIDATES.map((x) => transformedDensity(x));
  const maxDensity = Math.max(...densities);
  const chosenDensity = chosen === null ? null : transformedDensity(chosen);
  const passed = chosenDensity !== null && chosenDensity === maxDensity;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the value of x, among the four candidates, with the <strong>highest</strong> transformed density.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value of x to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_CANDIDATES.map((x) => (
          <button
            key={x}
            type="button"
            className={x === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(x);
            }}
          >
            x = {x}
          </button>
        ))}
      </div>
      {chosenDensity !== null && <ContributionBars items={[{ label: "density", value: chosenDensity }]} formatValue={(v) => v.toFixed(3)} max={maxDensity} />}
    </CheckpointFrame>
  );
}
