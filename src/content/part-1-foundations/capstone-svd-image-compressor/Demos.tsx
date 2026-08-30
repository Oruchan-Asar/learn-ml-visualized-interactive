"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import {
  IMAGE,
  SINGULAR_VALUES,
  U1,
  U2,
  CHECKPOINT_ERROR_THRESHOLD,
  rankKReconstruction,
  reconstructionError,
  energyRetained,
} from "@/lib/math-core/capstone-svd-image-compressor";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-svd-image-compressor";
const RANKS = [0, 1, 2] as const;

/** Intuition beat: slide through rank 0, 1, 2 reconstructions of the 4x4 toy image. */
export function IntuitionDemo() {
  const [rank, setRank] = useState<0 | 1 | 2>(0);
  const reconstruction = rankKReconstruction(rank);
  const error = reconstructionError(rank);

  return (
    <>
      <div className={styles.buttons}>
        {RANKS.map((r) => (
          <button key={r} type="button" className={r === rank ? styles.buttonActive : styles.button} onClick={() => setRank(r)}>
            rank {r}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KernelHeatmap kernel={IMAGE} label="original image" width={200} />
        <KernelHeatmap kernel={reconstruction} label={`rank-${rank} reconstruction`} width={200} />
      </div>
      <p>reconstruction error = {error.toFixed(3)} (energy retained: {(energyRetained(rank) * 100).toFixed(0)}%)</p>
    </>
  );
}

/** Play beat: the two "eigenface"-style row patterns (U1, U2) and how much energy each one carries. */
export function PlayDemo() {
  return (
    <>
      <ContributionBars
        items={U1.map((v, i) => ({ label: `row ${i + 1}`, value: v }))}
        max={0.5}
        readout={`pattern 1 (σ=${SINGULAR_VALUES[0]}) — every row weighted equally`}
      />
      <ContributionBars
        items={U2.map((v, i) => ({ label: `row ${i + 1}`, value: v }))}
        max={0.5}
        readout={`pattern 2 (σ=${SINGULAR_VALUES[1]}) — top half vs. bottom half`}
      />
      <ContributionBars
        items={[
          { label: "σ1²", value: SINGULAR_VALUES[0] ** 2 },
          { label: "σ2²", value: SINGULAR_VALUES[1] ** 2 },
        ]}
        max={SINGULAR_VALUES[0] ** 2}
        readout="pattern 1 alone already carries 80% of the image's total squared intensity"
      />
    </>
  );
}

/** Checkpoint: find the smallest rank whose reconstruction error drops below the threshold. */
export function ImageCompressorCheckpoint() {
  const [chosen, setChosen] = useState<0 | 1 | 2 | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const isValid = (r: 0 | 1 | 2) => reconstructionError(r) < CHECKPOINT_ERROR_THRESHOLD;
  const isMinimal = chosen !== null && isValid(chosen) && !(chosen > 0 && isValid((chosen - 1) as 0 | 1 | 2));
  const passed = isMinimal;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click the <strong>smallest</strong> rank whose reconstruction error drops below{" "}
          {CHECKPOINT_ERROR_THRESHOLD} (compute each rank&apos;s error by hand from the singular values 8
          and 4).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a rank to try it"
    >
      <div className={styles.buttons}>
        {RANKS.map((r) => (
          <button
            key={r}
            type="button"
            className={r === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(r);
            }}
          >
            rank {r}
          </button>
        ))}
      </div>
      {chosen !== null && <p>error at rank {chosen} = {reconstructionError(chosen).toFixed(3)}</p>}
    </CheckpointFrame>
  );
}
