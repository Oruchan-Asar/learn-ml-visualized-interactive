"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PATCHES, GRID_SIZE, patchAttentionWeights, chebyshevDistance, inSingleConvReceptiveField } from "@/lib/math-core/vision-transformers";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "vision-transformers";

function weightsToGrid(weights: number[]): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid.push(weights.slice(r * GRID_SIZE, (r + 1) * GRID_SIZE));
  }
  return grid;
}

/** Intuition beat: pick a query patch and see which other patches it attends to, regardless of distance. */
export function IntuitionDemo() {
  const [queryIndex, setQueryIndex] = useState(0);
  const weights = patchAttentionWeights(queryIndex);
  const query = PATCHES[queryIndex];
  return (
    <>
      <div className={styles.buttons}>
        {[0, 4, 8].map((i) => (
          <button key={i} type="button" className={i === queryIndex ? styles.buttonActive : styles.button} onClick={() => setQueryIndex(i)}>
            query: {PATCHES[i].label}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={weightsToGrid(weights)} label={`Attention weights from ${query.label} to every patch`} />
    </>
  );
}

/** Play beat: top-left's attention, and how much of it lands on a patch a single conv layer can't even reach. */
export function PlayDemo() {
  const weights = patchAttentionWeights(0);
  const tl = PATCHES[0];
  const br = PATCHES[8];
  const inField = weights.reduce((sum, w, i) => (inSingleConvReceptiveField(tl, PATCHES[i]) ? sum + w : sum), 0);
  return (
    <>
      <KernelHeatmap kernel={weightsToGrid(weights)} label="top-left's attention over the full 3x3 grid" />
      <ContributionBars
        items={[
          { label: "attention within a conv's reach", value: inField },
          { label: "attention on bottom-right alone", value: weights[8] },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout={`bottom-right is Chebyshev distance ${chebyshevDistance(tl, br)} away — outside a single 3x3 kernel's reach entirely — yet gets ${(weights[8] * 100).toFixed(1)}% of top-left's attention`}
      />
    </>
  );
}

/** Checkpoint: find the patch that top-left's attention favors most, besides itself. */
export function ViTCheckpoint() {
  const [choice, setChoice] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const weights = patchAttentionWeights(0);
  const candidates = [1, 8]; // top-middle (adjacent, dark) vs bottom-right (far, bright)
  const passed = choice === 8;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the patch, between the two candidates, that receives <strong>more attention</strong> from top-left — despite being on the opposite corner of the grid.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a patch to try it"
    >
      <div className={styles.buttons}>
        {candidates.map((i) => (
          <button
            key={i}
            type="button"
            className={i === choice ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(i);
            }}
          >
            {PATCHES[i].label}
          </button>
        ))}
      </div>
      {choice !== null && <ContributionBars items={[{ label: PATCHES[choice].label, value: weights[choice] }]} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
