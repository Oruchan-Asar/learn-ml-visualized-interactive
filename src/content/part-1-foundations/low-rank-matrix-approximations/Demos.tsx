"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import type { Mat2 } from "@/lib/math-core/matrices";
import {
  MATRIX,
  SINGULAR_VALUES,
  matrixRankKApproximation,
  reconstructionError,
  energyRetained,
  CHECKPOINT_MATRIX,
  CHECKPOINT_SINGULAR_VALUES,
  checkpointRankKApproximation,
  checkpointReconstructionError,
} from "@/lib/math-core/low-rank-matrix-approximations";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "low-rank-matrix-approximations";

function toGrid(m: Mat2): number[][] {
  return [
    [m.a, m.b],
    [m.c, m.d],
  ];
}

/** Intuition beat: toggle rank-1 vs. rank-2 (exact) reconstructions of MATRIX, watching the error shrink. */
export function IntuitionDemo() {
  const [rank, setRank] = useState<1 | 2>(1);
  const approx = matrixRankKApproximation(rank);
  const error = reconstructionError(rank);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={rank === 1 ? styles.buttonActive : styles.button} onClick={() => setRank(1)}>
          rank 1
        </button>
        <button type="button" className={rank === 2 ? styles.buttonActive : styles.button} onClick={() => setRank(2)}>
          rank 2 (exact)
        </button>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KernelHeatmap kernel={toGrid(MATRIX)} label="original A" width={120} />
        <KernelHeatmap kernel={toGrid(approx)} label={`rank-${rank} approximation`} width={120} />
      </div>
      <p>reconstruction error ‖A - A_k‖_F = {error.toFixed(3)}</p>
    </>
  );
}

/** Play beat: singular values as contribution bars, alongside both ranks' errors and retained energy. */
export function PlayDemo() {
  return (
    <>
      <ContributionBars
        items={[
          { label: "σ1²", value: SINGULAR_VALUES[0] ** 2 },
          { label: "σ2²", value: SINGULAR_VALUES[1] ** 2 },
        ]}
        max={SINGULAR_VALUES[0] ** 2}
        readout="squared singular values — the 'energy' each component of the SVD carries"
      />
      {[1, 2].map((k) => (
        <p key={k}>
          rank {k}: error = {reconstructionError(k as 1 | 2).toFixed(3)}, energy retained ={" "}
          {(energyRetained(SINGULAR_VALUES, k as 1 | 2) * 100).toFixed(1)}%
        </p>
      ))}
    </>
  );
}

const CANDIDATES = [2, 6, 8, 4];

/** Checkpoint: given a new matrix's singular values (6 and 2), pick the rank-1 reconstruction error. */
export function LowRankCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const correct = checkpointReconstructionError(1);
  const passed = chosen !== null && Math.abs(chosen - correct) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          A matrix with singular values {CHECKPOINT_SINGULAR_VALUES[0]} and {CHECKPOINT_SINGULAR_VALUES[1]} is
          truncated to rank 1. By the Eckart-Young theorem, what is the Frobenius-norm reconstruction
          error?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KernelHeatmap kernel={toGrid(CHECKPOINT_MATRIX)} label="matrix" width={100} />
        <KernelHeatmap kernel={toGrid(checkpointRankKApproximation(1))} label="rank-1 approx" width={100} />
      </div>
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
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
