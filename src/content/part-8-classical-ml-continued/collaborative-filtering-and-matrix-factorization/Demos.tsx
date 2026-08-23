"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { USERS, ITEMS, RATINGS, train, predict, totalError, MISSING } from "@/lib/math-core/collaborative-filtering-and-matrix-factorization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "collaborative-filtering-and-matrix-factorization";

function predictedGrid(k: number): number[][] {
  const factors = train(RATINGS, k, 2000);
  return USERS.map((_, ui) => ITEMS.map((_, ii) => Math.round(predict(factors, ui, ii) * 100) / 100));
}

function errorFor(k: number): number {
  return totalError(train(RATINGS, k, 2000), RATINGS);
}

/** Intuition beat: toggle the number of latent factors and watch the reconstructed ratings grid change. */
export function IntuitionDemo() {
  const [k, setK] = useState(1);
  const grid = predictedGrid(k);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={k === 1 ? styles.buttonActive : styles.button} onClick={() => setK(1)}>
          k=1
        </button>
        <button type="button" className={k === 2 ? styles.buttonActive : styles.button} onClick={() => setK(2)}>
          k=2
        </button>
      </div>
      <KernelHeatmap kernel={grid} width={220} label={`rows = users, cols = items — total error ${errorFor(k).toFixed(2)}`} />
    </>
  );
}

/** Play beat: compare k=1's systematic misses to k=2's near-perfect reconstruction. */
export function PlayDemo() {
  const grid1 = predictedGrid(1);
  const grid2 = predictedGrid(2);
  return (
    <>
      <KernelHeatmap kernel={grid1} width={200} label="k=1: U3 rated I3 a 5, predicted well under 2" />
      <KernelHeatmap kernel={grid2} width={200} label="k=2: every observed rating reconstructed almost exactly" />
    </>
  );
}

/** Checkpoint: find the k whose total error over the observed ratings drops below 0.01. */
export function CollaborativeFilteringCheckpoint() {
  const [k, setK] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const factors = train(RATINGS, k, 2000);
  const err = totalError(factors, RATINGS);
  const passed = err < 0.01;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the number of latent factors that reconstructs every observed rating with total error under <strong>0.01</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a k to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={k === 1 ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setK(1);
          }}
        >
          k=1
        </button>
        <button
          type="button"
          className={k === 2 ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setK(2);
          }}
        >
          k=2
        </button>
      </div>
      <KernelHeatmap
        kernel={predictedGrid(k)}
        width={220}
        label={`error ${err.toFixed(3)} — predicted missing rating: ${predict(factors, MISSING.user, MISSING.item).toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
