"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  DEFAULT_WEIGHT,
  DEFAULT_STEPS,
  MIN_STEPS,
  MAX_STEPS,
  TARGET_RATIO,
  rnnGradientProduct,
  lstmGradientProduct,
} from "@/lib/math-core/vanishing-gradients-rnns-lstms";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "vanishing-gradients-and-lstms";
const LOG_DOMAIN: [number, number] = [-14, 0];

function toLog(v: number): number {
  return Math.log10(Math.max(Math.abs(v), 1e-14));
}

function rnnCurve(steps: number): CurveLine {
  const points = [];
  for (let t = 1; t <= steps; t++) points.push({ x: t, y: toLog(rnnGradientProduct(t, DEFAULT_WEIGHT)) });
  return { points, variant: "fit" };
}

function lstmCurve(steps: number): CurveLine {
  const points = [];
  for (let t = 1; t <= steps; t++) points.push({ x: t, y: toLog(lstmGradientProduct(t, DEFAULT_WEIGHT)) });
  return { points, variant: "fitHighlight" };
}

function StepsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>timesteps = {value}</label>
      <input
        id={id}
        type="range"
        min={MIN_STEPS}
        max={MAX_STEPS}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: watch the plain RNN's gradient collapse while the LSTM's cell-state path barely moves. */
export function IntuitionDemo() {
  const [steps, setSteps] = useState(1);
  const rnnG = Math.abs(rnnGradientProduct(steps, DEFAULT_WEIGHT));
  const lstmG = lstmGradientProduct(steps, DEFAULT_WEIGHT);
  return (
    <>
      <MultiCurvePlayground
        curves={[rnnCurve(Math.max(steps, 2)), lstmCurve(Math.max(steps, 2))]}
        domain={[1, MAX_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={`timesteps = ${steps} — RNN gradient ≈ ${rnnG.toExponential(2)}, LSTM cell gradient ≈ ${lstmG.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <StepsSlider value={steps} onChange={setSteps} />
      </div>
    </>
  );
}

/** Play beat: same comparison, same weight value for both — the gap is architectural, not a matter of picking better numbers. */
export function PlayDemo() {
  const [steps, setSteps] = useState(5);
  const rnnG = Math.abs(rnnGradientProduct(steps, DEFAULT_WEIGHT));
  const lstmG = lstmGradientProduct(steps, DEFAULT_WEIGHT);
  const ratio = lstmG / rnnG;
  return (
    <>
      <MultiCurvePlayground
        curves={[rnnCurve(Math.max(steps, 2)), lstmCurve(Math.max(steps, 2))]}
        domain={[1, MAX_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={`timesteps = ${steps} — LSTM is ${ratio.toExponential(2)}× larger than the plain RNN`}
      />
      <div className={styles.controls}>
        <StepsSlider value={steps} onChange={setSteps} />
      </div>
    </>
  );
}

/** Checkpoint: find the sequence length where the LSTM's advantage over the plain RNN becomes overwhelming. */
export function VanishingRnnCheckpoint() {
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const rnnG = Math.abs(rnnGradientProduct(steps, DEFAULT_WEIGHT));
  const lstmG = lstmGradientProduct(steps, DEFAULT_WEIGHT);
  const ratio = lstmG / rnnG;

  const passed = ratio > TARGET_RATIO;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the number of timesteps until the LSTM&rsquo;s cell-state gradient is more than{" "}
          <strong>{TARGET_RATIO.toExponential(0)}</strong> times larger than the plain RNN&rsquo;s.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <MultiCurvePlayground
        curves={[rnnCurve(Math.max(steps, 2)), lstmCurve(Math.max(steps, 2))]}
        domain={[1, MAX_STEPS]}
        rangeDomain={LOG_DOMAIN}
        readout={`timesteps = ${steps} — ratio = ${ratio.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <StepsSlider
          value={steps}
          onChange={(v) => {
            setHasInteracted(true);
            setSteps(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
