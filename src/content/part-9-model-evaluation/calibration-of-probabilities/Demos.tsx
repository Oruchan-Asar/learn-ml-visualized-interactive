"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { reliabilityBuckets, expectedCalibrationError } from "@/lib/math-core/calibration-of-probabilities";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "calibration-of-probabilities";
const TOLERANCE = 0.005;

function KSlider({ value, onChange }: { value: number; onChange: (k: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>confidence exaggeration k = {value.toFixed(2)}</label>
      <input id={id} type="range" min={0.5} max={1.25} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function reliabilityBars(k: number) {
  const buckets = reliabilityBuckets(k);
  return [
    { label: "low bucket: predicted avg", value: buckets.low.predictedAvg },
    { label: "low bucket: actual rate", value: buckets.low.actualFreq },
    { label: "high bucket: predicted avg", value: buckets.high.predictedAvg },
    { label: "high bucket: actual rate", value: buckets.high.actualFreq },
  ];
}

/** Intuition beat: drag k and watch a model's stated confidence drift away from the actual outcome rate. */
export function IntuitionDemo() {
  const [k, setK] = useState(1);
  return (
    <>
      <ContributionBars items={reliabilityBars(k)} max={1} formatValue={(v) => v.toFixed(2)} readout={k === 1 ? "k=1: perfectly calibrated — predicted and actual match in both buckets" : "predicted and actual have pulled apart"} />
      <div className={styles.controls}>
        <KSlider value={k} onChange={setK} />
      </div>
    </>
  );
}

/** Play beat: same widget, now reporting the live Expected Calibration Error the formula computes. */
export function PlayDemo() {
  const [k, setK] = useState(1.2);
  const ece = expectedCalibrationError(k);
  return (
    <>
      <ContributionBars items={reliabilityBars(k)} max={1} formatValue={(v) => v.toFixed(2)} readout={`ECE(k=${k.toFixed(2)}) = ${ece.toFixed(4)}`} />
      <div className={styles.controls}>
        <KSlider value={k} onChange={setK} />
      </div>
    </>
  );
}

/** Checkpoint: find the k that makes this model perfectly calibrated (ECE = 0). */
export function CalibrationCheckpoint() {
  const [k, setK] = useState(0.5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ece = expectedCalibrationError(k);
  const passed = withinTolerance(ece, 0, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag <strong>k</strong> until Expected Calibration Error reaches <strong>0</strong> — predicted confidence exactly matches the actual outcome rate in both buckets.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag k to try it"
    >
      <ContributionBars items={reliabilityBars(k)} max={1} formatValue={(v) => v.toFixed(2)} readout={`ECE = ${ece.toFixed(4)}`} />
      <div className={styles.controls}>
        <KSlider
          value={k}
          onChange={(v) => {
            setHasInteracted(true);
            setK(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
