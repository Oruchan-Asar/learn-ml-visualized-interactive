"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { QUERIES, naiveLinearAttention, buildState, factoredLinearAttention, naiveOps, linearAttentionOps } from "@/lib/math-core/linear-attention";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "linear-attention";
const QUERY_LABELS = ["q0 = (1, 0)", "q1 = (0, 1)", "q2 = (1, 1)"];
const STATE = buildState();
const MAX_N = 64;

const NAIVE_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: naiveOps((MAX_N * i) / 64) })),
  variant: "fitHighlight",
};
const LINEAR_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: linearAttentionOps((MAX_N * i) / 64) })),
  variant: "true",
};

/** Intuition beat: pick a query and compute its answer two ways — rescanning every key, or a single dot product against the precomputed state. */
export function IntuitionDemo() {
  const [queryIndex, setQueryIndex] = useState(0);
  const q = QUERIES[queryIndex];
  const naive = naiveLinearAttention(q);
  const factored = factoredLinearAttention(q, STATE);

  return (
    <>
      <div className={styles.buttons}>
        {QUERY_LABELS.map((label, i) => (
          <button key={label} type="button" className={i === queryIndex ? styles.buttonActive : styles.button} onClick={() => setQueryIndex(i)}>
            {label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "rescan all 4 keys", value: naive },
          { label: "dot against precomputed state", value: factored },
        ]}
        formatValue={(v) => v.toFixed(4)}
        readout="same answer, every time — the state was built once, before either query ran"
      />
    </>
  );
}

/** Play beat: the same cost curves as last chapter, now for naive vs. factored linear attention specifically. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[LINEAR_CURVE, NAIVE_CURVE]}
      domain={[0, MAX_N]}
      rangeDomain={[0, naiveOps(MAX_N)]}
      readout={`at n = ${MAX_N}: naive = ${naiveOps(MAX_N)} ops, factored = ${linearAttentionOps(MAX_N)} ops`}
    />
  );
}

/** Checkpoint: find the query, among the three, whose attention output is the largest. */
export function LinearAttentionCheckpoint() {
  const [queryIndex, setQueryIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const outputs = QUERIES.map((q) => factoredLinearAttention(q, STATE));
  const maxOutput = Math.max(...outputs);
  const chosen = queryIndex === null ? null : outputs[queryIndex];
  const passed = chosen !== null && chosen === maxOutput;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the query, among the three candidates, whose linear-attention output is the <strong>largest</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a query to try it"
    >
      <div className={styles.buttons}>
        {QUERY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={i === queryIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setQueryIndex(i);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {chosen !== null && <ContributionBars items={[{ label: "output", value: chosen }]} formatValue={(v) => v.toFixed(3)} max={maxOutput} />}
    </CheckpointFrame>
  );
}
