"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { runKFoldCV, meanMSE, stdevMSE, singleSplitMSE } from "@/lib/math-core/cross-validation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "cross-validation";
const RESULTS = runKFoldCV();
const FOLD_LABELS = RESULTS.map((r) => `fold ${r.testIndices.map((i) => `x=${i + 1}`).join(",")}`);

/** Intuition beat: step through each fold one at a time and watch the held-out error swing wildly. */
export function IntuitionDemo() {
  const [foldIndex, setFoldIndex] = useState(0);
  const result = RESULTS[foldIndex];
  return (
    <>
      <div className={styles.buttons}>
        {RESULTS.map((r, i) => (
          <button key={i} type="button" className={i === foldIndex ? styles.buttonActive : styles.button} onClick={() => setFoldIndex(i)}>
            fold {i + 1}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[{ label: FOLD_LABELS[foldIndex], value: result.mse }]}
        readout={`train on the other 8 points, test on ${FOLD_LABELS[foldIndex]} → MSE = ${result.mse.toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: all 5 folds at once, plus the mean/stdev a single split would never reveal. */
export function PlayDemo() {
  const items = RESULTS.map((r, i) => ({ label: FOLD_LABELS[i], value: r.mse }));
  return (
    <ContributionBars
      items={items}
      readout={`mean = ${meanMSE(RESULTS).toFixed(2)}, stdev = ${stdevMSE(RESULTS).toFixed(2)} — one arbitrary 80/20 split scored ${singleSplitMSE().toFixed(2)}`}
    />
  );
}

/** Checkpoint: find which single fold, held out alone, produces by far the worst score. */
export function CrossValidationCheckpoint() {
  const [foldIndex, setFoldIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const worstIndex = RESULTS.reduce((worst, r, i) => (r.mse > RESULTS[worst].mse ? i : worst), 0);
  const passed = foldIndex === worstIndex;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the <strong>one fold</strong> whose held-out score is far worse than the rest.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a fold to try it"
    >
      <div className={styles.buttons}>
        {RESULTS.map((r, i) => (
          <button
            key={i}
            type="button"
            className={i === foldIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setFoldIndex(i);
            }}
          >
            fold {i + 1}
          </button>
        ))}
      </div>
      {foldIndex !== null && (
        <ContributionBars items={[{ label: FOLD_LABELS[foldIndex], value: RESULTS[foldIndex].mse }]} readout={`MSE = ${RESULTS[foldIndex].mse.toFixed(2)}`} />
      )}
    </CheckpointFrame>
  );
}
