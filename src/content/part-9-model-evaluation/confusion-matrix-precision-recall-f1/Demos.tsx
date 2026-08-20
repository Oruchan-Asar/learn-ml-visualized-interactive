"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRUE_LABELS,
  DUMB_PREDICTIONS,
  SMART_PREDICTIONS,
  confusionMatrix,
  accuracy,
  precision,
  recall,
  f1Score,
} from "@/lib/math-core/confusion-matrix-precision-recall-f1";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "confusion-matrix-precision-recall-f1";

function metricsFor(predictions: number[]) {
  const cm = confusionMatrix(TRUE_LABELS, predictions);
  return {
    items: [
      { label: "accuracy", value: accuracy(cm) },
      { label: "precision", value: precision(cm) },
      { label: "recall", value: recall(cm) },
      { label: "F1", value: f1Score(cm) },
    ],
    cm,
  };
}

/** Intuition beat: toggle between the two classifiers and watch every metric except accuracy diverge. */
export function IntuitionDemo() {
  const [smart, setSmart] = useState(false);
  const { items, cm } = metricsFor(smart ? SMART_PREDICTIONS : DUMB_PREDICTIONS);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!smart ? styles.buttonActive : styles.button} onClick={() => setSmart(false)}>
          Always predict negative
        </button>
        <button type="button" className={smart ? styles.buttonActive : styles.button} onClick={() => setSmart(true)}>
          Catch the positive
        </button>
      </div>
      <ContributionBars items={items} readout={`TP=${cm.truePositive} FP=${cm.falsePositive} TN=${cm.trueNegative} FN=${cm.falseNegative}`} />
    </>
  );
}

/** Play beat: both classifiers side by side — same accuracy, completely different everything else. */
export function PlayDemo() {
  const dumb = metricsFor(DUMB_PREDICTIONS);
  const smart = metricsFor(SMART_PREDICTIONS);
  return (
    <>
      <ContributionBars items={dumb.items} readout="always predicts negative" />
      <ContributionBars items={smart.items} readout="catches the one positive, one false alarm" />
    </>
  );
}

/** Checkpoint: find the classifier whose F1 score clears 0.5. */
export function ConfusionMatrixCheckpoint() {
  const [smart, setSmart] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const cm = confusionMatrix(TRUE_LABELS, smart ? SMART_PREDICTIONS : DUMB_PREDICTIONS);
  const passed = f1Score(cm) > 0.5;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the classifier whose <strong>F1 score</strong> clears <strong>0.5</strong> — accuracy alone won&apos;t tell you which one.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a classifier to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={!smart ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setSmart(false);
          }}
        >
          Always predict negative
        </button>
        <button
          type="button"
          className={smart ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setSmart(true);
          }}
        >
          Catch the positive
        </button>
      </div>
      <ContributionBars items={metricsFor(smart ? SMART_PREDICTIONS : DUMB_PREDICTIONS).items} readout={`F1 = ${f1Score(cm).toFixed(3)}`} />
    </CheckpointFrame>
  );
}
