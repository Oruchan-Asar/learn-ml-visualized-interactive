"use client";

import { useEffect, useState } from "react";
import { BayesGrid } from "@/components/viz/BayesGrid";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { posterior } from "@/lib/math-core/bayes";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./PriorSlider.module.css";

const SENSITIVITY = 0.9;
const FALSE_POSITIVE_RATE = 0.1;
const CONCEPT_ID = "conditional-probability-and-bayes-rule";
const TARGET_POSTERIOR = 0.5;
const TOLERANCE = 0.03;
const START_PRIOR = 0.05;

function PriorSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <label className={styles.sliderRow}>
      P(condition) — the base rate
      <input
        type="range"
        min={0.01}
        max={0.5}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(value * 100).toFixed(0)}%
    </label>
  );
}

/** Intuition beat: drag the base rate, watch the grid — and the surprise — unfold. */
export function IntuitionDemo() {
  const [prior, setPrior] = useState(START_PRIOR);
  return (
    <>
      <BayesGrid prior={prior} sensitivity={SENSITIVITY} falsePositiveRate={FALSE_POSITIVE_RATE} />
      <PriorSlider value={prior} onChange={setPrior} />
    </>
  );
}

/** Play beat: same grid, now with the posterior computed live via Bayes' rule. */
export function PlayDemo() {
  const [prior, setPrior] = useState(START_PRIOR);
  const post = posterior({ prior, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
  return (
    <>
      <BayesGrid
        prior={prior}
        sensitivity={SENSITIVITY}
        falsePositiveRate={FALSE_POSITIVE_RATE}
        readout={`P(condition | positive) = ${(post * 100).toFixed(1)}%`}
      />
      <PriorSlider value={prior} onChange={setPrior} />
    </>
  );
}

/** Checkpoint: find the base rate where a positive result is exactly a coin flip. */
export function BayesCheckpoint() {
  const [prior, setPrior] = useState(START_PRIOR);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const post = posterior({ prior, sensitivity: SENSITIVITY, falsePositiveRate: FALSE_POSITIVE_RATE });
  const passed = withinTolerance(post, TARGET_POSTERIOR, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the base rate until <code>P(condition | positive)</code> reads (approximately){" "}
          <strong>50%</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <BayesGrid
        prior={prior}
        sensitivity={SENSITIVITY}
        falsePositiveRate={FALSE_POSITIVE_RATE}
        readout={`P(condition | positive) = ${(post * 100).toFixed(1)}%`}
      />
      <PriorSlider
        value={prior}
        onChange={(v) => {
          setHasInteracted(true);
          setPrior(v);
        }}
      />
    </CheckpointFrame>
  );
}
