"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { rmsPerLayer, IDEAL_SCALE, NUM_LAYERS, SCALE_DOMAIN, HEALTHY_RANGE } from "@/lib/math-core/weight-init";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "weight-initialization";
const LOG_DOMAIN: [number, number] = [-6, 3];

function toLog(v: number): number {
  return Math.log10(Math.max(v, 1e-6));
}

function rmsCurve(scale: number): CurveLine {
  const values = rmsPerLayer(scale);
  return { points: values.map((v, i) => ({ x: i, y: toLog(v) })), variant: "fitHighlight" };
}

const HEALTHY_BAND: CurveLine[] = [
  { points: [{ x: 0, y: toLog(HEALTHY_RANGE[0]) }, { x: NUM_LAYERS, y: toLog(HEALTHY_RANGE[0]) }], variant: "true" },
  { points: [{ x: 0, y: toLog(HEALTHY_RANGE[1]) }, { x: NUM_LAYERS, y: toLog(HEALTHY_RANGE[1]) }], variant: "true" },
];

function ScaleSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>scale = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={SCALE_DOMAIN[0]}
        max={SCALE_DOMAIN[1]}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: drag the weight scale, watch log(RMS activation) per layer either sink or soar. */
export function IntuitionDemo() {
  const [scale, setScale] = useState(0.05);
  const finalRms = rmsPerLayer(scale)[NUM_LAYERS];
  return (
    <>
      <MultiCurvePlayground
        curves={[...HEALTHY_BAND, rmsCurve(scale)]}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`scale = ${scale.toFixed(2)} — layer 6 RMS = ${finalRms.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Play beat: same chart — the dashed lines mark the healthy band (0.3 to 3) each layer should stay inside. */
export function PlayDemo() {
  const [scale, setScale] = useState(1.0);
  const finalRms = rmsPerLayer(scale)[NUM_LAYERS];
  return (
    <>
      <MultiCurvePlayground
        curves={[...HEALTHY_BAND, rmsCurve(scale)]}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`scale = ${scale.toFixed(2)} — layer 6 RMS = ${finalRms.toExponential(2)} (ideal ≈ ${IDEAL_SCALE.toFixed(3)})`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Checkpoint: find a scale that keeps the final layer's activation inside the healthy band. */
export function WeightInitCheckpoint() {
  const [scale, setScale] = useState(0.05);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const finalRms = rmsPerLayer(scale)[NUM_LAYERS];

  const passed = finalRms > HEALTHY_RANGE[0] && finalRms < HEALTHY_RANGE[1];

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find a scale that keeps layer 6&rsquo;s activation between <strong>{HEALTHY_RANGE[0]}</strong> and{" "}
          <strong>{HEALTHY_RANGE[1]}</strong> — neither dead nor blown up.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the scale slider to try it"
    >
      <MultiCurvePlayground
        curves={[...HEALTHY_BAND, rmsCurve(scale)]}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`scale = ${scale.toFixed(2)} — layer 6 RMS = ${finalRms.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider
          value={scale}
          onChange={(v) => {
            setHasInteracted(true);
            setScale(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
