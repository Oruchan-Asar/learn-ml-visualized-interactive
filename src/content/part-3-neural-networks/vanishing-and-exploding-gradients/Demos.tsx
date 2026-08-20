"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { forwardBackward, gradientAtInput, MAX_DEPTH, VANISH_THRESHOLD } from "@/lib/math-core/vanishing-gradients";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "vanishing-and-exploding-gradients";
const LOG_DOMAIN: [number, number] = [-14, 0];

function toLog(v: number): number {
  return Math.log10(Math.max(Math.abs(v), 1e-14));
}

function gradientCurve(depth: number): CurveLine {
  const { gradients } = forwardBackward(depth);
  return { points: gradients.map((g, i) => ({ x: i, y: toLog(g) })), variant: "fitHighlight" };
}

const THRESHOLD_LINE: CurveLine = {
  points: [
    { x: 0, y: Math.log10(VANISH_THRESHOLD) },
    { x: MAX_DEPTH, y: Math.log10(VANISH_THRESHOLD) },
  ],
  variant: "true",
};

function DepthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>depth = {value}</label>
      <input
        id={id}
        type="range"
        min={1}
        max={MAX_DEPTH}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: drag depth, watch the gradient reaching the input shrink by more orders of magnitude every layer added. */
export function IntuitionDemo() {
  const [depth, setDepth] = useState(1);
  const gradient = gradientAtInput(depth);
  return (
    <>
      <MultiCurvePlayground
        curves={[THRESHOLD_LINE, gradientCurve(depth)]}
        domain={[0, MAX_DEPTH]}
        rangeDomain={LOG_DOMAIN}
        readout={`depth = ${depth} — gradient reaching the input ≈ ${gradient.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <DepthSlider value={depth} onChange={setDepth} />
      </div>
    </>
  );
}

/** Play beat: same curve — each additional layer costs roughly two more orders of magnitude. */
export function PlayDemo() {
  const [depth, setDepth] = useState(5);
  const gradient = gradientAtInput(depth);
  return (
    <>
      <MultiCurvePlayground
        curves={[THRESHOLD_LINE, gradientCurve(depth)]}
        domain={[0, MAX_DEPTH]}
        rangeDomain={LOG_DOMAIN}
        readout={`depth = ${depth} — gradient ≈ ${gradient.toExponential(2)} (dashed line = practically-zero threshold)`}
      />
      <div className={styles.controls}>
        <DepthSlider value={depth} onChange={setDepth} />
      </div>
    </>
  );
}

/** Checkpoint: find the depth at which the gradient reaching the input has practically vanished. */
export function VanishingCheckpoint() {
  const [depth, setDepth] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const gradient = gradientAtInput(depth);

  const passed = gradient < VANISH_THRESHOLD;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag depth until the gradient reaching the input drops below <strong>{VANISH_THRESHOLD}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the depth slider to try it"
    >
      <MultiCurvePlayground
        curves={[THRESHOLD_LINE, gradientCurve(depth)]}
        domain={[0, MAX_DEPTH]}
        rangeDomain={LOG_DOMAIN}
        readout={`depth = ${depth} — gradient ≈ ${gradient.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <DepthSlider
          value={depth}
          onChange={(v) => {
            setHasInteracted(true);
            setDepth(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
