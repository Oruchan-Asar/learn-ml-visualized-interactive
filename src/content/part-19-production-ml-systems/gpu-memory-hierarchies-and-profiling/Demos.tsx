"use client";

import { useEffect, useId, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  N_MIN,
  N_MAX,
  CROSSOVER_N,
  transferTime,
  computeTime,
  bottleneckTime,
  regime,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/gpu-memory-hierarchies-and-profiling";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "gpu-memory-hierarchies-and-profiling";
const N_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];
const PLAY_MAX = Math.max(computeTime(N_MAX), transferTime(N_MAX));

function NSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>N = {value}</label>
      <input
        id={id}
        type="range"
        min={N_MIN}
        max={N_MAX}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: slide the matmul size N and watch which of transfer time or compute time is the bottleneck. */
export function IntuitionDemo() {
  const [n, setN] = useState(4);
  const t = transferTime(n);
  const c = computeTime(n);
  return (
    <>
      <NSlider value={n} onChange={setN} />
      <ContributionBars
        items={[
          { label: "HBM transfer time", value: t },
          { label: "compute time", value: c },
        ]}
        formatValue={(v) => v.toFixed(1)}
        readout={`${n}×${n} matmul: ${regime(n)} — bottleneck runtime ${bottleneckTime(n).toFixed(1)}`}
      />
    </>
  );
}

/** Play beat: sweep across a fixed set of sizes on a shared scale, watching the crossover at N = 8. */
export function PlayDemo() {
  const [n, setN] = useState(N_OPTIONS[0]);
  const t = transferTime(n);
  const c = computeTime(n);
  return (
    <>
      <div className={styles.buttons}>
        {N_OPTIONS.map((opt) => (
          <button key={opt} type="button" className={opt === n ? styles.buttonActive : styles.button} onClick={() => setN(opt)}>
            N = {opt}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "HBM transfer time", value: t },
          { label: "compute time", value: c },
        ]}
        formatValue={(v) => v.toFixed(1)}
        max={PLAY_MAX}
        readout={`${regime(n)} — at exactly N = ${CROSSOVER_N} the two times are equal (${bottleneckTime(CROSSOVER_N).toFixed(1)} each); below it transfer wins, above it compute wins`}
      />
    </>
  );
}

/** Checkpoint: of three unseen sizes, exactly one runs compute-bound. Find it. */
export function GpuMemoryCheckpoint() {
  const [n, setN] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = n !== null && regime(n) === "compute-bound";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Of these three matmul sizes, exactly one runs <strong>compute-bound</strong> rather than
          memory-bound. Find it.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a size to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_CANDIDATES.map((opt) => (
          <button
            key={opt}
            type="button"
            className={opt === n ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setN(opt);
            }}
          >
            N = {opt}
          </button>
        ))}
      </div>
      {n !== null && (
        <ContributionBars
          items={[
            { label: "HBM transfer time", value: transferTime(n) },
            { label: "compute time", value: computeTime(n) },
          ]}
          formatValue={(v) => v.toFixed(1)}
        />
      )}
    </CheckpointFrame>
  );
}
