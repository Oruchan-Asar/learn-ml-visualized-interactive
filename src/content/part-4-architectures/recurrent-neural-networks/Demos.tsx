"use client";

import { useEffect, useId, useState } from "react";
import { RNNTrace } from "@/components/viz/RNNTrace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  SEQUENCE_A,
  SEQUENCE_B,
  DEFAULT_WH,
  DOMAIN,
  TARGET_SEPARATION,
  runSequence,
  finalHidden,
} from "@/lib/math-core/recurrent-neural-networks";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "recurrent-neural-networks";

function WhSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>Wh = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={DOMAIN[0]}
        max={DOMAIN[1]}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: one sequence, one hidden state, carried forward one token at a time. */
export function IntuitionDemo() {
  const [wh, setWh] = useState(DEFAULT_WH);
  const trace = runSequence(SEQUENCE_A, wh);
  return (
    <>
      <RNNTrace
        rows={[{ label: "A: [X, Y]", trace, tokenLabels: ["X", "Y"] }]}
        readout={`h0 = 0 → h1 = ${trace[1].h.toFixed(3)} → h2 = ${trace[2].h.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <WhSlider value={wh} onChange={setWh} />
      </div>
    </>
  );
}

/** Play beat: the exact same two sequences from Chapter 5, now processed one token at a time. */
export function PlayDemo() {
  const [wh, setWh] = useState(DEFAULT_WH);
  const traceA = runSequence(SEQUENCE_A, wh);
  const traceB = runSequence(SEQUENCE_B, wh);
  const hA = traceA[traceA.length - 1].h;
  const hB = traceB[traceB.length - 1].h;
  return (
    <>
      <RNNTrace
        rows={[
          { label: "A: [X, Y]", trace: traceA, tokenLabels: ["X", "Y"] },
          { label: "B: [Y, X]", trace: traceB, tokenLabels: ["Y", "X"] },
        ]}
        readout={`final hA = ${hA.toFixed(3)}, final hB = ${hB.toFixed(3)} — separation = ${Math.abs(hA - hB).toFixed(3)}`}
      />
      <div className={styles.controls}>
        <WhSlider value={wh} onChange={setWh} />
      </div>
    </>
  );
}

/** Checkpoint: push the recurrent weight until the two sequences' final hidden states are clearly, confidently different. */
export function RnnCheckpoint() {
  const [wh, setWh] = useState(DEFAULT_WH);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const hA = finalHidden(SEQUENCE_A, wh);
  const hB = finalHidden(SEQUENCE_B, wh);
  const separation = Math.abs(hA - hB);

  const passed = separation > TARGET_SEPARATION;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const traceA = runSequence(SEQUENCE_A, wh);
  const traceB = runSequence(SEQUENCE_B, wh);

  return (
    <CheckpointFrame
      instructions={
        <>
          Adjust the recurrent weight until the two sequences&rsquo; final hidden states differ by more than{" "}
          <strong>{TARGET_SEPARATION}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <RNNTrace
        rows={[
          { label: "A: [X, Y]", trace: traceA, tokenLabels: ["X", "Y"] },
          { label: "B: [Y, X]", trace: traceB, tokenLabels: ["Y", "X"] },
        ]}
        readout={`separation = ${separation.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <WhSlider
          value={wh}
          onChange={(v) => {
            setHasInteracted(true);
            setWh(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
