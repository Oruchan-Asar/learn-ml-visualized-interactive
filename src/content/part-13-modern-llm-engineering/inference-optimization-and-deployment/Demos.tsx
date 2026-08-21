"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { workWithoutCache, workWithCache, speedupRatio, quantizeAll, MEMORY_REDUCTION_FACTOR } from "@/lib/math-core/inference-optimization-and-deployment";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "inference-optimization-and-deployment";
const SEQUENCE_LENGTHS = [10, 50, 100];

/** Intuition beat: pick a sequence length and compare the total attention work with and without caching. */
export function IntuitionDemo() {
  const [nIndex, setNIndex] = useState(0);
  const n = SEQUENCE_LENGTHS[nIndex];
  return (
    <>
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((len, i) => (
          <button key={len} type="button" className={i === nIndex ? styles.buttonActive : styles.button} onClick={() => setNIndex(i)}>
            n = {len}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "without cache", value: workWithoutCache(n) },
          { label: "with cache", value: workWithCache(n) },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`generating ${n} tokens: ${speedupRatio(n).toFixed(1)}x less total work with a KV cache`}
      />
    </>
  );
}

/** Play beat: the speedup ratio itself grows with sequence length, plus quantization's near-free memory win. */
export function PlayDemo() {
  const quantized = quantizeAll();
  return (
    <>
      <ContributionBars
        items={SEQUENCE_LENGTHS.map((n) => ({ label: `n=${n}`, value: speedupRatio(n) }))}
        formatValue={(v) => `${v.toFixed(1)}x`}
        readout="the KV-cache speedup isn't a fixed constant — it grows as the sequence gets longer"
      />
      <ContributionBars
        items={quantized.map((q) => ({ label: `w=${q.original}`, value: q.error }))}
        formatValue={(v) => v.toFixed(4)}
        readout={`int8 quantization: ${MEMORY_REDUCTION_FACTOR}x smaller, errors all under 0.004`}
      />
    </>
  );
}

/** Checkpoint: find the sequence length where the KV-cache speedup exceeds 40x. */
export function InferenceOptCheckpoint() {
  const [nIndex, setNIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ratio = nIndex === null ? null : speedupRatio(SEQUENCE_LENGTHS[nIndex]);
  const passed = ratio !== null && ratio > 40;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the sequence length, among the three candidates, where the KV-cache speedup exceeds <strong>40x</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a sequence length to try it"
    >
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((n, i) => (
          <button
            key={n}
            type="button"
            className={i === nIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setNIndex(i);
            }}
          >
            n = {n}
          </button>
        ))}
      </div>
      {ratio !== null && <ContributionBars items={[{ label: "speedup", value: ratio }]} formatValue={(v) => `${v.toFixed(1)}x`} />}
    </CheckpointFrame>
  );
}
