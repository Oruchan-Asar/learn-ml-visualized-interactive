"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recoveredGradient, G_RAW, SCALE_DOMAIN, TARGET_SCALE } from "@/lib/math-core/mixed-precision-training";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "mixed-precision-training";
const RECOVERY_TOLERANCE = 1e-6;

function gradientItems(scale: number) {
  return [
    { label: "true gradient", value: G_RAW },
    { label: "recovered from fp16 storage", value: recoveredGradient(scale) },
  ];
}

function ScaleSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>loss scale = {value.toFixed(1)}×</label>
      <input
        id={id}
        type="range"
        min={SCALE_DOMAIN[0]}
        max={SCALE_DOMAIN[1]}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: no scaling — the true gradient is too small for the toy fp16 format, and it stores as a flat zero. */
export function IntuitionDemo() {
  const [scale, setScale] = useState(1);
  const recovered = recoveredGradient(scale);
  return (
    <>
      <ContributionBars
        items={gradientItems(scale)}
        max={G_RAW}
        formatValue={(v) => v.toExponential(2)}
        readout={recovered === 0 ? "stored as exactly 0 — this parameter stops learning" : `recovered ≈ ${recovered.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Play beat: drag the loss scale up and watch the exact moment the gradient stops underflowing. */
export function PlayDemo() {
  const [scale, setScale] = useState(TARGET_SCALE);
  const recovered = recoveredGradient(scale);
  return (
    <>
      <ContributionBars
        items={gradientItems(scale)}
        max={G_RAW}
        formatValue={(v) => v.toExponential(2)}
        readout={`scale = ${scale.toFixed(1)}× — recovered gradient = ${recovered.toExponential(2)}`}
      />
      <div className={styles.controls}>
        <ScaleSlider value={scale} onChange={setScale} />
      </div>
    </>
  );
}

/** Checkpoint: find a loss scale that rescues the true gradient from underflowing to zero. */
export function MixedPrecisionCheckpoint() {
  const [scale, setScale] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const recovered = recoveredGradient(scale);
  const passed = withinTolerance(recovered, G_RAW, RECOVERY_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Raise the loss scale until the recovered gradient matches the true gradient ({G_RAW.toExponential(0)})
          instead of underflowing to zero.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the scale slider to try it"
    >
      <ContributionBars
        items={gradientItems(scale)}
        max={G_RAW}
        formatValue={(v) => v.toExponential(2)}
        readout={`scale = ${scale.toFixed(1)}× — recovered gradient = ${recovered.toExponential(2)}`}
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
