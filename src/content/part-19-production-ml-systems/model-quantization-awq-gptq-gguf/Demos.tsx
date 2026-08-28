"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  WEIGHTS,
  SCALE,
  quantizeLevel,
  dequantize,
  quantizeVector,
  meanSquaredError,
  fp32Bytes,
  int4Bytes,
  compressionRatio,
  CHECKPOINT_WEIGHT,
} from "@/lib/math-core/model-quantization-awq-gptq-gguf";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "model-quantization-awq-gptq-gguf";
const CHECKPOINT_OPTIONS = [2, 3, 4, 5];

const ROWS = quantizeVector();

/** Intuition beat: pick one weight and watch it round to its nearest 4-bit level, exactly or with error. */
export function IntuitionDemo() {
  const [index, setIndex] = useState(0);
  const row = ROWS[index];
  const hasError = Math.abs(row.error) > 1e-9;
  return (
    <>
      <div className={styles.buttons}>
        {WEIGHTS.map((w, i) => (
          <button key={i} type="button" className={i === index ? styles.buttonActive : styles.button} onClick={() => setIndex(i)}>
            {w.toFixed(1)}
          </button>
        ))}
      </div>
      <p>
        {row.original.toFixed(1)} ÷ scale ({SCALE.toFixed(2)}) → level {row.level} → reconstructed{" "}
        {row.reconstructed.toFixed(2)}
        {hasError ? ` — off by ${row.error.toFixed(2)}` : " — exact, zero error"}
      </p>
      <ContributionBars
        items={ROWS.map((r) => ({ label: r.original.toFixed(1), value: r.error }))}
        formatValue={(v) => v.toFixed(2)}
        readout={`only ${ROWS.filter((r) => Math.abs(r.error) > 1e-9).length} of ${ROWS.length} weights pick up rounding error — the rest are exact multiples of the scale`}
      />
    </>
  );
}

/** Play beat: the memory cost of storing the vector in FP32 versus packed 4-bit levels, and the error that buys. */
export function PlayDemo() {
  const n = WEIGHTS.length;
  return (
    <>
      <ContributionBars
        items={[
          { label: "FP32 (8 weights, 4 bytes each)", value: fp32Bytes(n) },
          { label: "INT4 (packed + 1 shared scale)", value: int4Bytes(n) },
        ]}
        formatValue={(v) => `${v} bytes`}
        readout={`${compressionRatio(n)}× smaller — mean squared reconstruction error across the whole vector: ${meanSquaredError().toFixed(4)}`}
      />
    </>
  );
}

/** Checkpoint: an unseen weight — quantize it to its 4-bit level by hand. */
export function QuantizationCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = quantizeLevel(CHECKPOINT_WEIGHT);
  const passed = chosen === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          A fresh weight, {CHECKPOINT_WEIGHT}, needs to be quantized with the same scale ({SCALE.toFixed(2)}).
          Which 4-bit level does it round to?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a level to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_OPTIONS.map((c) => (
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
      {chosen !== null && <p>level {chosen} → reconstructed {dequantize(chosen).toFixed(2)}</p>}
    </CheckpointFrame>
  );
}
