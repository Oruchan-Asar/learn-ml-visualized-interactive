"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { POOLED_A, MIN_LOSS, DOMAIN, TOLERANCE, f, gradient, type Vec2 } from "@/lib/math-core/sequence-order";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "why-sequences-break-feedforward-nets";

function fieldFn(x: number, y: number): number {
  return f({ x, y });
}
function fieldGradient(x: number, y: number): { x: number; y: number } {
  return gradient({ x, y });
}

/** Intuition beat: two token sequences, opposite order, summed into the exact same vector. */
export function IntuitionDemo() {
  return (
    <VectorPlayground
      vectors={[
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: POOLED_A[0], y: POOLED_A[1] },
      ]}
      domain={[-0.5, 2.5]}
      readout={`token X = (1, 0), token Y = (0, 1) — "X then Y" and "Y then X" both sum to (${POOLED_A[0]}, ${POOLED_A[1]})`}
    />
  );
}

/** Play beat: drag the dense layer's two weights around — the loss only ever depends on their sum. */
export function PlayDemo() {
  const [w, setW] = useState<Vec2>({ x: 1.5, y: -0.5 });
  const loss = f(w);
  return (
    <ContourPlayground
      fn={fieldFn}
      gradient={fieldGradient}
      domain={DOMAIN}
      value={w}
      onChange={setW}
      readout={`w = (${w.x.toFixed(2)}, ${w.y.toFixed(2)}) — loss = ${loss.toFixed(4)} (best possible: ${MIN_LOSS.toFixed(4)})`}
    />
  );
}

/** Checkpoint: try to beat pure guessing. The best reachable loss is ln(2) — there's no weight setting better than that. */
export function SequenceOrderCheckpoint() {
  const [w, setW] = useState<Vec2>({ x: 2, y: 2 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const loss = f(w);

  const passed = withinTolerance(loss, MIN_LOSS, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the point until the loss reaches its best possible value, <strong>{MIN_LOSS.toFixed(3)}</strong> — the
          loss of a network that can only guess.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <ContourPlayground
        fn={fieldFn}
        gradient={fieldGradient}
        domain={DOMAIN}
        value={w}
        onChange={(next) => {
          setHasInteracted(true);
          setW(next);
        }}
        passed={passed}
        readout={`w = (${w.x.toFixed(2)}, ${w.y.toFixed(2)}) — loss = ${loss.toFixed(4)}`}
      />
    </CheckpointFrame>
  );
}
