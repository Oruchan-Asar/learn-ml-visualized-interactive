"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine, type CurvePoint } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  RATIO_DOMAIN,
  unclippedObjective,
  clippedObjective,
  isClipActive,
  runRatioScript,
} from "@/lib/math-core/proximal-policy-optimization-ppo";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "proximal-policy-optimization-ppo";
const RANGE_DOMAIN: [number, number] = [0.2, 1.8];
const SAMPLES = 60;

const UNCLIPPED_POINTS: CurvePoint[] = Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const r = RATIO_DOMAIN[0] + ((RATIO_DOMAIN[1] - RATIO_DOMAIN[0]) * i) / SAMPLES;
  return { x: r, y: unclippedObjective(r) };
});
const CLIPPED_POINTS: CurvePoint[] = Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const r = RATIO_DOMAIN[0] + ((RATIO_DOMAIN[1] - RATIO_DOMAIN[0]) * i) / SAMPLES;
  return { x: r, y: clippedObjective(r) };
});
const CURVES: CurveLine[] = [
  { points: UNCLIPPED_POINTS, variant: "true" },
  { points: CLIPPED_POINTS, variant: "fitHighlight" },
];

function RatioSlider({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>ratio r = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={RATIO_DOMAIN[0]}
        max={RATIO_DOMAIN[1]}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: drag the ratio and watch the clipped objective (bold) peel away from the plain
 * one (dashed) once the policy has moved past 1+epsilon. */
export function IntuitionDemo() {
  const [r, setR] = useState(1.0);
  const clipActive = isClipActive(r);

  return (
    <>
      <MultiCurvePlayground
        curves={CURVES}
        domain={RATIO_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={[{ x: r, y: clippedObjective(r) }]}
        readout={`unclipped = ${unclippedObjective(r).toFixed(2)}, clipped = ${clippedObjective(r).toFixed(2)}${clipActive ? " — clip is active" : ""}`}
      />
      <div className={styles.controls}>
        <RatioSlider value={r} onChange={setR} />
      </div>
    </>
  );
}

/** Play beat: step through a fixed script of ratios, from "moved toward less likely" to "moved a lot toward more likely". */
export function PlayDemo() {
  const script = runRatioScript();
  const [i, setI] = useState(2);
  const current = script[i];

  return (
    <>
      <MultiCurvePlayground
        curves={CURVES}
        domain={RATIO_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={[{ x: current.r, y: current.clipped }]}
        readout={`r = ${current.r.toFixed(2)} — ${current.clipActive ? "clip is holding the objective below the unclipped value" : "no clipping in effect"}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.max(0, n - 1))}>
          Previous ratio
        </button>
        <button type="button" className={styles.button} onClick={() => setI((n) => Math.min(script.length - 1, n + 1))}>
          Next ratio
        </button>
      </div>
    </>
  );
}

const TARGET_RATIO = 1.4;
const TARGET_TOLERANCE = 0.2; // passes for r in [1.2, 1.6] — exactly where the clip engages, since 1+epsilon=1.2

/** Checkpoint: push the ratio slider far enough that the clip is actively flattening the objective. */
export function PpoCheckpoint() {
  const [r, setR] = useState(1.0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = withinTolerance(r, TARGET_RATIO, TARGET_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Move the ratio slider until the policy has moved far enough (past <strong>1+ε = 1.2</strong>) that the clip is actively flattening the objective.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the ratio slider to try it"
    >
      <MultiCurvePlayground
        curves={CURVES}
        domain={RATIO_DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={[{ x: r, y: clippedObjective(r) }]}
        readout={`r = ${r.toFixed(2)} — unclipped ${unclippedObjective(r).toFixed(2)}, clipped ${clippedObjective(r).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <RatioSlider
          value={r}
          onChange={(v) => {
            setHasInteracted(true);
            setR(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
