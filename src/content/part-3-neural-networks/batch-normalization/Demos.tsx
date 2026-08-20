"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  rmsPerLayer,
  NUM_LAYERS,
  SCALE_DOMAIN,
  IDEAL_SCALE,
  BAD_LOW,
  BAD_HIGH,
  GOOD_LOW,
  GOOD_HIGH,
} from "@/lib/math-core/batch-norm";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "batch-normalization";
const LOG_DOMAIN: [number, number] = [-6, 3];

function toLog(v: number): number {
  return Math.log10(Math.max(v, 1e-6));
}

function curvesFor(scale: number): CurveLine[] {
  const without = rmsPerLayer(scale, false);
  const withBN = rmsPerLayer(scale, true);
  return [
    { points: without.map((v, i) => ({ x: i, y: toLog(v) })), variant: "fit" },
    { points: withBN.map((v, i) => ({ x: i, y: toLog(v) })), variant: "fitHighlight" },
  ];
}

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

/** Intuition beat: drag the same "bad" scale from Chapter 8 — the faint line still breaks, but the bold one (batch norm) doesn't. */
export function IntuitionDemo() {
  const [scale, setScale] = useState(0.05);
  const withBNFinal = rmsPerLayer(scale, true)[NUM_LAYERS];
  return (
    <>
      <MultiCurvePlayground
        curves={curvesFor(scale)}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`scale = ${scale.toFixed(2)} — with batch norm, layer 6 RMS = ${withBNFinal.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Play beat: same two curves — try the ideal scale, then anything far from it, and watch the bold line barely move either way. */
export function PlayDemo() {
  const [scale, setScale] = useState(IDEAL_SCALE);
  const without = rmsPerLayer(scale, false)[NUM_LAYERS];
  const withBN = rmsPerLayer(scale, true)[NUM_LAYERS];
  return (
    <>
      <MultiCurvePlayground
        curves={curvesFor(scale)}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`without BN: ${without.toExponential(2)} — with BN: ${withBN.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Checkpoint: pick a scale that would badly break the network, then confirm batch norm rescues it anyway. */
export function BatchNormCheckpoint() {
  const [scale, setScale] = useState(IDEAL_SCALE);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const without = rmsPerLayer(scale, false)[NUM_LAYERS];
  const withBN = rmsPerLayer(scale, true)[NUM_LAYERS];

  const wouldHaveBroken = without < BAD_LOW || without > BAD_HIGH;
  const staysHealthy = withBN > GOOD_LOW && withBN < GOOD_HIGH;
  const passed = wouldHaveBroken && staysHealthy;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Pick a scale that would badly break the network without batch norm — then confirm the batch-normalized
          version stays healthy anyway.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the scale slider to try it"
    >
      <MultiCurvePlayground
        curves={curvesFor(scale)}
        domain={[0, NUM_LAYERS]}
        rangeDomain={LOG_DOMAIN}
        readout={`without BN: ${without.toExponential(2)} — with BN: ${withBN.toFixed(3)}`}
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
