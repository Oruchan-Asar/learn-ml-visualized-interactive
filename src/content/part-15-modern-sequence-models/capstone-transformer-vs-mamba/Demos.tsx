"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CANDIDATE_LENGTHS,
  SIGNAL_POSITION,
  buildSequence,
  selectiveRecall,
  transformerCost,
  mambaCost,
  transformerMemory,
  mambaMemory,
} from "@/lib/math-core/capstone-transformer-vs-mamba";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-transformer-vs-mamba";
const MAX_N = 128;

const TRANSFORMER_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: transformerCost((MAX_N * i) / 64) })),
  variant: "fitHighlight",
};
const MAMBA_CURVE: CurveLine = {
  points: Array.from({ length: 65 }, (_, i) => ({ x: (MAX_N * i) / 64, y: mambaCost((MAX_N * i) / 64) })),
  variant: "true",
};

/** Intuition beat: pick a sequence length and confirm both architectures find the exact same buried signal, at very different cost. */
export function IntuitionDemo() {
  const [n, setN] = useState(32);
  const recovered = selectiveRecall(buildSequence(n));

  return (
    <>
      <div className={styles.buttons}>
        {CANDIDATE_LENGTHS.map((len) => (
          <button key={len} type="button" className={len === n ? styles.buttonActive : styles.button} onClick={() => setN(len)}>
            n = {len}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "Transformer cost", value: transformerCost(n) },
          { label: "Mamba cost", value: mambaCost(n) },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`both recover the buried value exactly (${recovered}) — the signal sat at position ${SIGNAL_POSITION} of ${n}`}
      />
    </>
  );
}

/** Play beat: the full cost curves, exactly as promised at the end of Chapter 1 — the gap this whole part has been building toward. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[MAMBA_CURVE, TRANSFORMER_CURVE]}
      domain={[0, MAX_N]}
      rangeDomain={[0, transformerCost(MAX_N)]}
      readout={`at n = ${MAX_N}: Transformer memory = ${transformerMemory(MAX_N)} cached pairs, Mamba memory = ${mambaMemory()} state`}
    />
  );
}

/** Checkpoint: find the smallest candidate sequence length where the Transformer's cost clears 10,000 ops. */
export function ComparisonCheckpoint() {
  const [n, setN] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const cost = n === null ? null : transformerCost(n);
  const smallestQualifying = CANDIDATE_LENGTHS.find((len) => transformerCost(len) >= 10000);
  const passed = n !== null && n === smallestQualifying;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the <strong>smallest</strong> sequence length, among the candidates, where the Transformer&apos;s cost clears <strong>10,000</strong> ops.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a sequence length to try it"
    >
      <div className={styles.buttons}>
        {CANDIDATE_LENGTHS.map((len) => (
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
      {cost !== null && <ContributionBars items={[{ label: "Transformer cost", value: cost }]} formatValue={(v) => v.toFixed(0)} max={transformerCost(128)} />}
    </CheckpointFrame>
  );
}
