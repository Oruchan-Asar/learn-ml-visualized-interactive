"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  NUM_LAYERS,
  DEFAULT_PATTERN,
  type LayerType,
  layerCost,
  totalCost,
  costForAttentionCount,
  SEQUENCE_LENGTHS,
  ATTENTION_COUNTS,
} from "@/lib/math-core/hybrid-transformer-ssm-architectures";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "hybrid-transformer-ssm-architectures";
const N_SMALL = 8;

/** Intuition beat: toggle each of the 4 layers between attention and SSM, watching the per-layer and total cost respond immediately. */
export function IntuitionDemo() {
  const [pattern, setPattern] = useState<LayerType[]>(DEFAULT_PATTERN);

  const toggle = (i: number) => {
    setPattern((prev) => prev.map((t, idx) => (idx === i ? (t === "attention" ? "ssm" : "attention") : t)));
  };

  return (
    <>
      <div className={styles.buttons}>
        {pattern.map((t, i) => (
          <button key={i} type="button" className={t === "attention" ? styles.buttonActive : styles.button} onClick={() => toggle(i)}>
            layer {i + 1}: {t}
          </button>
        ))}
      </div>
      <ContributionBars
        items={pattern.map((t, i) => ({ label: `layer ${i + 1} (${t})`, value: layerCost(t, N_SMALL) }))}
        formatValue={(v) => v.toFixed(0)}
        readout={`n = ${N_SMALL} — total cost = ${totalCost(pattern, N_SMALL).toFixed(0)}`}
      />
    </>
  );
}

const ALL_ATTN_CURVE: CurveLine = {
  points: SEQUENCE_LENGTHS.map((n) => ({ x: n, y: costForAttentionCount(NUM_LAYERS, n) })),
  variant: "fitHighlight",
};
const HYBRID_CURVE: CurveLine = {
  points: SEQUENCE_LENGTHS.map((n) => ({ x: n, y: costForAttentionCount(1, n) })),
  variant: "fit",
};
const ALL_SSM_CURVE: CurveLine = {
  points: SEQUENCE_LENGTHS.map((n) => ({ x: n, y: costForAttentionCount(0, n) })),
  variant: "true",
};

/** Play beat: the three curves — all-attention (quadratic), all-SSM (linear), and the 1-attention-layer hybrid — as sequence length grows. */
export function PlayDemo() {
  const maxN = SEQUENCE_LENGTHS[SEQUENCE_LENGTHS.length - 1];
  return (
    <MultiCurvePlayground
      curves={[ALL_SSM_CURVE, HYBRID_CURVE, ALL_ATTN_CURVE]}
      domain={[0, maxN]}
      rangeDomain={[0, costForAttentionCount(NUM_LAYERS, maxN)]}
      scatterPoints={SEQUENCE_LENGTHS.map((n) => ({ x: n, y: costForAttentionCount(1, n) }))}
      readout={`at n = ${maxN}: all-attention = ${costForAttentionCount(NUM_LAYERS, maxN).toLocaleString()}, hybrid (1 attention layer) = ${costForAttentionCount(1, maxN).toLocaleString()}, all-SSM = ${costForAttentionCount(0, maxN).toLocaleString()}`}
    />
  );
}

const TARGET_N = 64;
const TARGET = costForAttentionCount(1, TARGET_N);

/** Checkpoint: at a fixed sequence length, pick the number of attention layers (0-4) that lands the total cost on the 1-attention-layer hybrid's exact value. */
export function HybridCheckpoint() {
  const [k, setK] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const value = k === null ? null : costForAttentionCount(k, TARGET_N);
  const passed = value !== null && withinTolerance(value, TARGET, 1);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          At n = {TARGET_N}, find the number of attention layers, among the candidates, whose total cost
          lands on <strong>{TARGET.toLocaleString()}</strong> — the cost of a stack with exactly 1 attention
          layer.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a count to try it"
    >
      <div className={styles.buttons}>
        {ATTENTION_COUNTS.map((count) => (
          <button
            key={count}
            type="button"
            className={count === k ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setK(count);
            }}
          >
            {count} attention
          </button>
        ))}
      </div>
      {value !== null && (
        <ContributionBars
          items={[
            { label: "total cost", value },
            { label: "target", value: TARGET },
          ]}
          formatValue={(v) => v.toLocaleString()}
        />
      )}
    </CheckpointFrame>
  );
}
