"use client";

import { useEffect, useId, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  PATCHES,
  T,
  DEFAULT_T,
  adaLN,
  ditAttentionMatrix,
  selfAttentionWeight,
  TARGET_SELF_WEIGHT,
} from "@/lib/math-core/diffusion-transformers-dit";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "diffusion-transformers-dit";
const PATCH_LABELS = PATCHES.map((p) => p.label);

function TimestepSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>t = {value.toFixed(1)}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={T}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: the 2x2 patch grid, flattened into a length-4 sequence, then run through the exact same
 * self-attention a text transformer would use -- patches are just tokens. */
export function IntuitionDemo() {
  const matrix = ditAttentionMatrix(DEFAULT_T);
  return (
    <>
      <TokenChips tokens={PATCH_LABELS} />
      <KernelHeatmap
        kernel={matrix}
        label={`patch self-attention at t=${DEFAULT_T} (rows = query, cols = key: ${PATCH_LABELS.join(", ")})`}
        width={200}
      />
      <p className={styles.controls}>
        Four patches, flattened into a sequence -- exactly like four words. Every row is a query patch
        attending over every key patch, the same scaled dot-product softmax a text transformer runs, just
        fed patch content instead of word embeddings.
      </p>
    </>
  );
}

/** Play beat: drag the timestep and watch adaLN stretch each patch's content, which in turn reshapes the
 * attention matrix -- one backbone, every noise level. */
export function PlayDemo() {
  const [t, setT] = useState(DEFAULT_T);
  const matrix = ditAttentionMatrix(t);
  const selfWeight = selfAttentionWeight(t);

  return (
    <>
      <KernelHeatmap kernel={matrix} label={`patch self-attention at t=${t.toFixed(1)}`} width={200} />
      <ContributionBars
        items={PATCHES.map((p) => ({ label: p.label, value: adaLN(p.content, t) }))}
        formatValue={(v) => v.toFixed(2)}
        readout={`p0's attention to itself = ${selfWeight.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <TimestepSlider value={t} onChange={setT} />
      </div>
    </>
  );
}

/** Checkpoint: drag the timestep up until p0's self-attention weight clears the target threshold -- the
 * conditioning stretches p0's already-largest content further from the rest as t rises. */
export function DitCheckpoint() {
  const [t, setT] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const value = selfAttentionWeight(t);
  const passed = value > TARGET_SELF_WEIGHT;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>t</strong> up until p0 pays more than <strong>{TARGET_SELF_WEIGHT}</strong> of its
          attention to itself.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag t to try it"
    >
      <KernelHeatmap kernel={ditAttentionMatrix(t)} label={`patch self-attention at t=${t.toFixed(1)}`} width={200} />
      <div className={styles.controls}>
        <TimestepSlider
          value={t}
          onChange={(v) => {
            setHasInteracted(true);
            setT(v);
          }}
        />
      </div>
      <p className={styles.controls}>{`p0's self-attention weight = ${value.toFixed(3)}`}</p>
    </CheckpointFrame>
  );
}
