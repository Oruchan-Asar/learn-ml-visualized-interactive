"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import {
  ACTIVATIONS,
  mean,
  rmsNormalize,
  layerNormalize,
  GAIN_DOMAIN,
  DEFAULT_GAIN,
  TARGET_CHANNEL_INDEX,
  TARGET_VALUE,
  TARGET_TOLERANCE,
} from "@/lib/math-core/rmsnorm";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "rmsnorm";
const CHANNEL_LABELS = ["c1", "c2", "c3", "c4 (target)", "c5", "c6"];
const NORM_MAX = 2.5;

function rmsItems(gain: number) {
  return rmsNormalize(ACTIVATIONS, gain).map((v, i) => ({ label: CHANNEL_LABELS[i], value: v }));
}

function GainSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>gain = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={GAIN_DOMAIN[0]}
        max={GAIN_DOMAIN[1]}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: RMSNorm's output at gain=1, compared against LayerNorm on the exact same input — RMSNorm's mean isn't 0. */
export function IntuitionDemo() {
  const [gain, setGain] = useState(DEFAULT_GAIN);
  const rmsOut = rmsNormalize(ACTIVATIONS, gain);
  const lnOut = layerNormalize(ACTIVATIONS);
  return (
    <>
      <ContributionBars
        items={rmsOut.map((v, i) => ({ label: CHANNEL_LABELS[i], value: v }))}
        max={NORM_MAX}
        readout={`RMSNorm — output mean ≈ ${mean(rmsOut).toFixed(3)} (LayerNorm's would be ≈ ${mean(lnOut).toFixed(3)})`}
      />
      <div className={styles.controls}>
        <GainSlider value={gain} onChange={setGain} />
      </div>
    </>
  );
}

/** Play beat: gain scales every output linearly — no re-centering happens at any gain. */
export function PlayDemo() {
  const [gain, setGain] = useState(1.5);
  const out = rmsNormalize(ACTIVATIONS, gain);
  return (
    <>
      <ContributionBars
        items={rmsItems(gain)}
        max={NORM_MAX}
        readout={`c4 (raw value ${ACTIVATIONS[TARGET_CHANNEL_INDEX]}) normalizes to ${out[TARGET_CHANNEL_INDEX].toFixed(3)}`}
      />
      <div className={styles.controls}>
        <GainSlider value={gain} onChange={setGain} />
      </div>
    </>
  );
}

/** Checkpoint: tune the gain until the largest-magnitude channel lands near a specific target value. */
export function RmsNormCheckpoint() {
  const [gain, setGain] = useState(DEFAULT_GAIN);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const out = rmsNormalize(ACTIVATIONS, gain);
  const value = out[TARGET_CHANNEL_INDEX];
  const passed = withinTolerance(value, TARGET_VALUE, TARGET_TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Tune the gain until channel c4 (raw value {ACTIVATIONS[TARGET_CHANNEL_INDEX]}) normalizes to about{" "}
          <strong>{TARGET_VALUE}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the gain slider to try it"
    >
      <ContributionBars
        items={rmsItems(gain)}
        max={NORM_MAX}
        readout={`c4 = ${value.toFixed(3)} (target ${TARGET_VALUE} ± ${TARGET_TOLERANCE})`}
      />
      <div className={styles.controls}>
        <GainSlider
          value={gain}
          onChange={(v) => {
            setHasInteracted(true);
            setGain(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
