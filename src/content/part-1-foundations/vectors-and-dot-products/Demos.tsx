"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { dot, angleBetweenDegrees, type Vec2 } from "@/lib/math-core/vectors";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-6, 6];
const A: Vec2 = { x: 4, y: 0 };
const START_B: Vec2 = { x: 3, y: 3 };
const CONCEPT_ID = "vectors-and-dot-products";
const TARGET_DOT = 0;
const TOLERANCE = 0.6;

/** Intuition beat: A is fixed, B is draggable — just the angle, no formula yet. */
export function IntuitionDemo() {
  const [b, setB] = useState<Vec2>(START_B);
  const angle = angleBetweenDegrees(A, b);
  return (
    <VectorPlayground
      vectors={[
        { ...A, draggable: false },
        { ...b, draggable: true },
      ]}
      onChangeVector={(i, next) => i === 1 && setB(next)}
      domain={DOMAIN}
      readout={`θ = ${angle.toFixed(0)}°`}
    />
  );
}

/** Play beat: same setup, now with the dot product value alongside the angle. */
export function PlayDemo() {
  const [b, setB] = useState<Vec2>(START_B);
  const d = dot(A, b);
  const angle = angleBetweenDegrees(A, b);
  return (
    <VectorPlayground
      vectors={[
        { ...A, draggable: false },
        { ...b, draggable: true },
      ]}
      onChangeVector={(i, next) => i === 1 && setB(next)}
      domain={DOMAIN}
      readout={`a·b = ${d.toFixed(2)}, θ = ${angle.toFixed(0)}°`}
    />
  );
}

/** Checkpoint: drag B until a·b = 0 — i.e. until the two arrows are perpendicular. */
export function DotProductCheckpoint() {
  const [b, setB] = useState<Vec2>(START_B);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const d = dot(A, b);
  const passed = withinTolerance(d, TARGET_DOT, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>B</strong> until <code>a·b</code> reads (approximately) <strong>zero</strong> —
          the two arrows form a right angle.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag B to try it"
    >
      <VectorPlayground
        vectors={[
          { ...A, draggable: false },
          { ...b, draggable: true },
        ]}
        onChangeVector={(i, next) => {
          if (i !== 1) return;
          setHasInteracted(true);
          setB(next);
        }}
        domain={DOMAIN}
        passed={passed}
        readout={`a·b = ${d.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
