"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  softmax,
  softmaxWithTemperature,
  argmax,
  CLASS_LABELS,
  BASE_LOGITS,
  CHECKPOINT_LOGITS,
  TEMPERATURE_MIN,
  TEMPERATURE_MAX,
  LOGIT_MIN,
  LOGIT_MAX,
} from "@/lib/math-core/multinomial-logistic-regression-and-softmax";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "multinomial-logistic-regression-and-softmax";

function probItems(logits: number[]) {
  const probs = softmax(logits);
  return CLASS_LABELS.map((label, i) => ({ label: `${label} (z=${logits[i]})`, value: probs[i] }));
}

function LogitSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>
        {label} = {value}
      </label>
      <input
        id={id}
        type="range"
        min={LOGIT_MIN}
        max={LOGIT_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: three editable logits, live-recomputed probabilities that always sum to 1. */
export function IntuitionDemo() {
  const [logits, setLogits] = useState<number[]>([...BASE_LOGITS]);
  const probs = softmax(logits);
  const sum = probs.reduce((a, b) => a + b, 0);
  return (
    <>
      <ContributionBars items={probItems(logits)} max={1} formatValue={(v) => v.toFixed(3)} readout={`probabilities sum to ${sum.toFixed(6)}`} />
      <div className={styles.controls}>
        {CLASS_LABELS.map((label, i) => (
          <LogitSlider
            key={label}
            label={`z(${label})`}
            value={logits[i]}
            onChange={(v) => setLogits((prev) => prev.map((z, j) => (j === i ? v : z)))}
          />
        ))}
      </div>
    </>
  );
}

/** Play beat: temperature scaling — same logits, T reshapes confidence without changing the ranking. */
export function PlayDemo() {
  const [temperature, setTemperature] = useState(1);
  const id = useId();
  const probs = softmaxWithTemperature(BASE_LOGITS, temperature);
  const items = CLASS_LABELS.map((label, i) => ({ label: `${label} (z=${BASE_LOGITS[i]})`, value: probs[i] }));
  return (
    <>
      <ContributionBars items={items} max={1} formatValue={(v) => v.toFixed(3)} readout={`T = ${temperature.toFixed(2)}`} />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label htmlFor={id}>temperature T = {temperature.toFixed(2)}</label>
          <input
            id={id}
            type="range"
            min={TEMPERATURE_MIN}
            max={TEMPERATURE_MAX}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}

const CANDIDATES = [0.33, 0.42, 0.50, 0.58];

/** Checkpoint: compute softmax of a fixed logit triple by hand, then pick the matching probability for one class. */
export function SoftmaxCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const correctProb = softmax(CHECKPOINT_LOGITS)[argmax(CHECKPOINT_LOGITS)];
  const passed = chosen !== null && Math.abs(chosen - correctProb) < 0.005;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Three logits: <code>z = [1, 1, 2]</code> for {CLASS_LABELS.join(", ")}. Which value is the probability of the{" "}
          <strong>{CLASS_LABELS[argmax(CHECKPOINT_LOGITS)]}</strong> class (the one with the highest logit)?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c.toFixed(2)}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
