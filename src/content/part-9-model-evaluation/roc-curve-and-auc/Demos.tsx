"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { rocCurve, auc, accuracyAtThreshold } from "@/lib/math-core/roc-curve-and-auc";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "roc-curve-and-auc";
const DOMAIN: [number, number] = [0, 1];
const CURVE = rocCurve();
const ROC_LINE: CurveLine = { points: CURVE.map((p) => ({ x: p.fpr, y: p.tpr })), variant: "fitHighlight" };
const DIAGONAL: CurveLine = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], variant: "true" };

function currentPoint(threshold: number) {
  const sorted = [...CURVE].sort((a, b) => (b.threshold === Infinity ? -1 : b.threshold) - (a.threshold === Infinity ? -1 : a.threshold));
  const point = sorted.find((p) => p.threshold <= threshold) ?? sorted[sorted.length - 1];
  return point;
}

function ThresholdSlider({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>threshold = {value.toFixed(2)}</label>
      <input id={id} type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Intuition beat: drag the decision threshold and watch which single point on the ROC curve you're at. */
export function IntuitionDemo() {
  const [threshold, setThreshold] = useState(0.5);
  const point = currentPoint(threshold);
  return (
    <>
      <MultiCurvePlayground
        curves={[DIAGONAL, ROC_LINE]}
        domain={DOMAIN}
        rangeDomain={DOMAIN}
        scatterPoints={[{ x: point.fpr, y: point.tpr }]}
        readout={`FPR=${point.fpr.toFixed(2)}, TPR=${point.tpr.toFixed(2)}, accuracy=${accuracyAtThreshold(threshold).toFixed(2)}`}
      />
      <div className={styles.controls}>
        <ThresholdSlider value={threshold} onChange={setThreshold} />
      </div>
    </>
  );
}

/** Play beat: the whole curve at once, against the diagonal a random guesser would trace. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[DIAGONAL, ROC_LINE]}
      domain={DOMAIN}
      rangeDomain={DOMAIN}
      readout={`AUC = ${auc().toFixed(3)} — a random guesser's diagonal would score exactly 0.5`}
    />
  );
}

/** Checkpoint: find the threshold where TPR first reaches 1.0 — every positive caught. */
export function RocCheckpoint() {
  const [threshold, setThreshold] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const point = currentPoint(threshold);
  const passed = point.tpr === 1 && point.fpr <= 1 / 3;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the threshold until <strong>every positive</strong> is caught (TPR=1) with the fewest possible false alarms.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the threshold to try it"
    >
      <MultiCurvePlayground
        curves={[DIAGONAL, ROC_LINE]}
        domain={DOMAIN}
        rangeDomain={DOMAIN}
        scatterPoints={[{ x: point.fpr, y: point.tpr }]}
        readout={`FPR=${point.fpr.toFixed(2)}, TPR=${point.tpr.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <ThresholdSlider
          value={threshold}
          onChange={(v) => {
            setHasInteracted(true);
            setThreshold(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
