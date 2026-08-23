"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PREDICTIONS, isTrusted, separationAccuracy } from "@/lib/math-core/hallucination-detection-and-calibration";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "hallucination-detection-and-calibration";

function predictionItems(threshold: number) {
  return PREDICTIONS.map((p) => ({
    label: `${p.label} (${p.correct ? "correct" : "wrong"}, ${isTrusted(p.confidence, threshold) ? "trusted" : "flagged"})`,
    value: p.confidence,
  }));
}

function accuracyReadout(threshold: number): string {
  const accuracy = separationAccuracy(threshold);
  return `separation accuracy: ${(accuracy * PREDICTIONS.length).toFixed(0)}/${PREDICTIONS.length}`;
}

/** Intuition beat: a low threshold trusts almost everything, a high one flags almost everything — compare against which ones are actually right. */
export function IntuitionDemo() {
  const [threshold, setThreshold] = useState(0.3);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={threshold === 0.3 ? styles.buttonActive : styles.button} onClick={() => setThreshold(0.3)}>
          low threshold (0.30)
        </button>
        <button type="button" className={threshold === 0.8 ? styles.buttonActive : styles.button} onClick={() => setThreshold(0.8)}>
          high threshold (0.80)
        </button>
      </div>
      <ContributionBars items={predictionItems(threshold)} formatValue={(v) => v.toFixed(2)} max={1} readout={accuracyReadout(threshold)} />
    </>
  );
}

/** Play beat: drag the threshold continuously and watch separation accuracy rise, peak, then fall. */
export function PlayDemo() {
  const [threshold, setThreshold] = useState(0.5);

  return (
    <>
      <ContributionBars items={predictionItems(threshold)} formatValue={(v) => v.toFixed(2)} max={1} readout={accuracyReadout(threshold)} />
      <label className={styles.sliderRow}>
        trust threshold
        <input type="range" min={0} max={1} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
        {threshold.toFixed(2)}
      </label>
    </>
  );
}

/** Checkpoint: find a threshold that separates the correct predictions from the wrong ones perfectly. */
export function HallucinationCheckpoint() {
  const [threshold, setThreshold] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = separationAccuracy(threshold) === 1;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide the trust threshold until it separates the correct predictions from the wrong ones <strong>perfectly</strong> — every correct one trusted, every wrong one flagged.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the slider to try it"
    >
      <ContributionBars items={predictionItems(threshold)} formatValue={(v) => v.toFixed(2)} max={1} readout={accuracyReadout(threshold)} />
      <label className={styles.sliderRow}>
        trust threshold
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => {
            setHasInteracted(true);
            setThreshold(Number(e.target.value));
          }}
        />
        {threshold.toFixed(2)}
      </label>
    </CheckpointFrame>
  );
}
