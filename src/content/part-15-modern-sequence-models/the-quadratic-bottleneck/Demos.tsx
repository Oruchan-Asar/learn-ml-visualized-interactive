"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { attentionOps, linearOps, costRatio, SEQUENCE_LENGTHS } from "@/lib/math-core/the-quadratic-bottleneck";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "the-quadratic-bottleneck";
const MAX_N = 128;

const ATTENTION_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => {
    const n = (MAX_N * i) / 64;
    return { x: n, y: attentionOps(n) };
  }),
  variant: "fitHighlight",
};
const LINEAR_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => {
    const n = (MAX_N * i) / 64;
    return { x: n, y: linearOps(n) };
  }),
  variant: "true",
};

/** Intuition beat: pick a sequence length and compare attention's cost to a linear layer's, side by side. */
export function IntuitionDemo() {
  const [n, setN] = useState(16);
  return (
    <>
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((len) => (
          <button key={len} type="button" className={len === n ? styles.buttonActive : styles.button} onClick={() => setN(len)}>
            n = {len}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "attention", value: attentionOps(n) },
          { label: "linear layer", value: linearOps(n) },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`attention costs ${costRatio(n)}x the linear layer at n = ${n}`}
      />
    </>
  );
}

/** Play beat: both cost curves over the full range at once — the parabola versus the line the hook promised. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[LINEAR_CURVE, ATTENTION_CURVE]}
      domain={[0, MAX_N]}
      rangeDomain={[0, attentionOps(MAX_N)]}
      scatterPoints={SEQUENCE_LENGTHS.map((n) => ({ x: n, y: attentionOps(n) }))}
      readout={`at n = ${MAX_N}: attention = ${attentionOps(MAX_N).toLocaleString()} ops, linear = ${linearOps(MAX_N).toLocaleString()} ops`}
    />
  );
}

/** Checkpoint: find the sequence length where attention first costs at least 20x a linear layer. */
export function BottleneckCheckpoint() {
  const [n, setN] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ratio = n === null ? null : costRatio(n);
  const smallestQualifying = SEQUENCE_LENGTHS.find((len) => costRatio(len) >= 20);
  const passed = n !== null && n === smallestQualifying;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>smallest</strong> sequence length, among the candidates, where attention costs at least <strong>20x</strong> a linear layer.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a sequence length to try it"
    >
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((len) => (
          <button
            key={len}
            type="button"
            className={len === n ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setN(len);
            }}
          >
            n = {len}
          </button>
        ))}
      </div>
      {ratio !== null && <ContributionBars items={[{ label: "cost ratio", value: ratio }]} formatValue={(v) => `${v.toFixed(0)}x`} max={128} />}
    </CheckpointFrame>
  );
}
