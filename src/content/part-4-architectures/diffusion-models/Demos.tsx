"use client";

import { useEffect, useId, useState } from "react";
import { RNNTrace, type RNNTraceRow } from "@/components/viz/RNNTrace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { X0, FORWARD, TARGET_ERROR, reverseProcess, reconstructedX0 } from "@/lib/math-core/diffusion-models";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "diffusion-models";

function forwardRow(): RNNTraceRow {
  const trace = FORWARD.map((s) => ({ t: s.t, token: s.t === 0 ? null : [1], h: s.value }));
  return { label: "forward (adding noise)", trace, tokenLabels: FORWARD.slice(1).map((s) => `x${s.t}`) };
}

function reverseRow(quality: number): RNNTraceRow {
  const steps = reverseProcess(quality);
  const trace = steps.map((s, i) => ({ t: s.t, token: i === 0 ? null : [1], h: s.value }));
  return { label: "reverse (denoising)", trace, tokenLabels: steps.slice(1).map((s) => `x${s.t}`) };
}

function QualitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>denoiser quality = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: watch data become noise, step by step, then reverse it back with a perfect denoiser. */
export function IntuitionDemo() {
  return (
    <>
      <RNNTrace rows={[forwardRow(), reverseRow(1)]} readout={`x0 = ${X0} → (forward) → reverse recovers exactly ${reconstructedX0(1).toFixed(2)}`} />
    </>
  );
}

/** Play beat: drag the denoiser's quality down — watch the recovered x0 estimate drift away from the true value. */
export function PlayDemo() {
  const [quality, setQuality] = useState(0.5);
  const reconstructed = reconstructedX0(quality);
  return (
    <>
      <RNNTrace
        rows={[reverseRow(quality)]}
        readout={`reconstructed x0 ≈ ${reconstructed.toFixed(3)} (true x0 = ${X0}) — error = ${Math.abs(reconstructed - X0).toFixed(3)}`}
      />
      <div className={styles.controls}>
        <QualitySlider value={quality} onChange={setQuality} />
      </div>
    </>
  );
}

/** Checkpoint: find a denoiser good enough that the reconstruction error drops below the target. */
export function DiffusionCheckpoint() {
  const [quality, setQuality] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const reconstructed = reconstructedX0(quality);
  const error = Math.abs(reconstructed - X0);

  const passed = withinTolerance(error, 0, TARGET_ERROR);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Raise the denoiser&rsquo;s quality until the reconstructed x0 is within <strong>{TARGET_ERROR}</strong> of
          the true value, <strong>{X0}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <RNNTrace rows={[reverseRow(quality)]} readout={`reconstructed x0 ≈ ${reconstructed.toFixed(3)} — error = ${error.toFixed(3)}`} />
      <div className={styles.controls}>
        <QualitySlider
          value={quality}
          onChange={(v) => {
            setHasInteracted(true);
            setQuality(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
