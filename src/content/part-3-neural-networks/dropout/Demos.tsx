"use client";

import { useEffect, useId, useState } from "react";
import { DropoutLayer } from "@/components/viz/DropoutLayer";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ACTIVATIONS,
  TRUE_OUTPUT,
  sampleAtIndex,
  expectedActiveCount,
  RATE_DOMAIN,
  TARGET_ACTIVE_COUNT,
  TARGET_TOLERANCE,
} from "@/lib/math-core/dropout";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "dropout";

function RateSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>dropout rate = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={RATE_DOMAIN[0]}
        max={RATE_DOMAIN[1]}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: resample a random mask at a fixed dropout rate — the output swings around, but never systematically off. */
export function IntuitionDemo() {
  const [rate] = useState(0.5);
  const [sampleIndex, setSampleIndex] = useState(0);
  const sample = sampleAtIndex(rate, sampleIndex);
  return (
    <>
      <DropoutLayer
        activations={ACTIVATIONS}
        mask={sample.mask}
        readout={`this draw's output = ${sample.output.toFixed(2)} (true output = ${TRUE_OUTPUT.toFixed(2)})`}
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setSampleIndex((i) => i + 1)}>
            Resample
          </button>
        </div>
      </div>
    </>
  );
}

/** Play beat: same resampling, plus the dropout rate itself — watch how many neurons survive each draw. */
export function PlayDemo() {
  const [rate, setRate] = useState(0.4);
  const [sampleIndex, setSampleIndex] = useState(0);
  const sample = sampleAtIndex(rate, sampleIndex);
  return (
    <>
      <DropoutLayer
        activations={ACTIVATIONS}
        mask={sample.mask}
        readout={`${sample.activeCount}/8 active — output = ${sample.output.toFixed(2)}, expected active = ${expectedActiveCount(rate).toFixed(1)}`}
      />
      <div className={styles.controls}>
        <RateSlider value={rate} onChange={setRate} />
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setSampleIndex((i) => i + 1)}>
            Resample
          </button>
        </div>
      </div>
    </>
  );
}

/** Checkpoint: set the dropout rate so the expected number of surviving neurons hits the target. */
export function DropoutCheckpoint() {
  const [rate, setRate] = useState(0);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const sample = sampleAtIndex(rate, sampleIndex);
  const expected = expectedActiveCount(rate);

  const passed = Math.abs(expected - TARGET_ACTIVE_COUNT) < TARGET_TOLERANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Set the dropout rate so the <strong>expected</strong> number of surviving neurons is{" "}
          <strong>{TARGET_ACTIVE_COUNT}</strong> out of 8.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the rate slider to try it"
    >
      <DropoutLayer
        activations={ACTIVATIONS}
        mask={sample.mask}
        readout={`expected active = ${expected.toFixed(2)} — this draw: ${sample.activeCount}/8 active`}
      />
      <div className={styles.controls}>
        <RateSlider
          value={rate}
          onChange={(v) => {
            setHasInteracted(true);
            setRate(v);
          }}
        />
        <div className={styles.buttons}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setSampleIndex((i) => i + 1)}>
            Resample
          </button>
        </div>
      </div>
    </CheckpointFrame>
  );
}
