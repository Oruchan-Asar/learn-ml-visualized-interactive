"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  EXAMPLES,
  DEFAULT_THRESHOLD,
  metricsAt,
  rankingAUC,
  foldAccuracies,
  bestThreshold,
} from "@/lib/math-core/capstone-evaluate-a-real-pipeline";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-evaluate-a-real-pipeline";
const THRESHOLD_CANDIDATES = [0.7, 0.5, 0.3];

/** Intuition beat: the same classifier, three thresholds, three completely different F1 scores. */
export function IntuitionDemo() {
  const [threshold, setThreshold] = useState(0.5);
  const m = metricsAt(threshold);
  return (
    <>
      <div className={styles.buttons}>
        {THRESHOLD_CANDIDATES.map((t) => (
          <button key={t} type="button" className={t === threshold ? styles.buttonActive : styles.button} onClick={() => setThreshold(t)}>
            threshold={t}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "accuracy", value: m.accuracy },
          { label: "precision", value: m.precision },
          { label: "recall", value: m.recall },
          { label: "F1", value: m.f1 },
        ]}
        readout={`TP=${m.cm.truePositive} FP=${m.cm.falsePositive} TN=${m.cm.trueNegative} FN=${m.cm.falseNegative}`}
      />
    </>
  );
}

/** Play beat: every lens from this part, applied to the same ten examples, side by side. */
export function PlayDemo() {
  const m = metricsAt(DEFAULT_THRESHOLD);
  const auc = rankingAUC();
  const folds = foldAccuracies();
  const best = bestThreshold();
  return (
    <>
      <ContributionBars
        items={[
          { label: "accuracy @ 0.5", value: m.accuracy },
          { label: "F1 @ 0.5", value: m.f1 },
          { label: "ranking AUC", value: auc },
          { label: `best F1 @ ${best.threshold}`, value: best.f1 },
        ]}
        readout="four scores, four different verdicts on the exact same classifier"
      />
      <ContributionBars
        items={folds.map((f, i) => ({ label: `fold ${i + 1}`, value: f.accuracy }))}
        readout="fold-by-fold accuracy: the two 'easy' folds score 1.0, the three folds straddling the boundary score 0.5"
      />
    </>
  );
}

/** Checkpoint: find the threshold that scores the highest F1 among the three candidates. */
export function EvaluatePipelineCheckpoint() {
  const [threshold, setThreshold] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const scored = THRESHOLD_CANDIDATES.map((t) => ({ t, f1: metricsAt(t).f1 }));
  const bestCandidate = scored.reduce((best, s) => (s.f1 > best.f1 ? s : best), scored[0]);
  const passed = threshold === bestCandidate.t;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the threshold, among the three candidates, that scores the <strong>highest F1</strong> — not the highest accuracy.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a threshold to try it"
    >
      <div className={styles.buttons}>
        {THRESHOLD_CANDIDATES.map((t) => (
          <button
            key={t}
            type="button"
            className={t === threshold ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setThreshold(t);
            }}
          >
            threshold={t}
          </button>
        ))}
      </div>
      {threshold !== null && (
        <ContributionBars
          items={[
            { label: "accuracy", value: metricsAt(threshold).accuracy },
            { label: "F1", value: metricsAt(threshold).f1 },
          ]}
          readout={`n=${EXAMPLES.length} examples`}
        />
      )}
    </CheckpointFrame>
  );
}
