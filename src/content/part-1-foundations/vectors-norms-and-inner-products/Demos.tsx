"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import type { Vec2 } from "@/lib/math-core/vectors";
import { l1Norm, l2Norm, lInfNorm, cosineSimilarity } from "@/lib/math-core/vectors-norms-and-inner-products";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-6, 6];
const START_V: Vec2 = { x: 3, y: 4 };
const MAX_NORM = 12;
const FIXED_A: Vec2 = { x: 4, y: 0 };
const START_B: Vec2 = { x: 3, y: 4 };
const CONCEPT_ID = "vectors-norms-and-inner-products";
const TARGET_SIMILARITY = 0;
const TOLERANCE = 0.12;

/** Intuition beat: one draggable vector, three different rulers measuring its "size." */
export function IntuitionDemo() {
  const [v, setV] = useState<Vec2>(START_V);
  return (
    <>
      <VectorPlayground vectors={[{ ...v, draggable: true }]} onChangeVector={(i, next) => i === 0 && setV(next)} domain={DOMAIN} />
      <ContributionBars
        items={[
          { label: "L1", value: l1Norm(v) },
          { label: "L2", value: l2Norm(v) },
          { label: "L∞", value: lInfNorm(v) },
        ]}
        max={MAX_NORM}
      />
    </>
  );
}

/** Play beat: a fixed reference vector a, a draggable b, and the cosine similarity between them. */
export function PlayDemo() {
  const [b, setB] = useState<Vec2>(START_B);
  const sim = cosineSimilarity(FIXED_A, b);
  return (
    <VectorPlayground
      vectors={[
        { ...FIXED_A, draggable: false },
        { ...b, draggable: true },
      ]}
      onChangeVector={(i, next) => i === 1 && setB(next)}
      domain={DOMAIN}
      readout={`cos θ = ${sim.toFixed(2)}  (cosine distance = ${(1 - sim).toFixed(2)})`}
    />
  );
}

/** Checkpoint: drag b until it's perpendicular to the fixed a — cosine similarity crosses zero. */
export function NormsCheckpoint() {
  const [b, setB] = useState<Vec2>(START_B);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const sim = cosineSimilarity(FIXED_A, b);
  const passed = withinTolerance(sim, TARGET_SIMILARITY, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>b</strong> until it&rsquo;s <strong>perpendicular</strong> to the fixed vector <strong>a</strong> —
          the exact point where cosine similarity crosses zero.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag b to try it"
    >
      <VectorPlayground
        vectors={[
          { ...FIXED_A, draggable: false },
          { ...b, draggable: true },
        ]}
        onChangeVector={(i, next) => {
          if (i !== 1) return;
          setHasInteracted(true);
          setB(next);
        }}
        domain={DOMAIN}
        passed={passed}
        readout={`cos θ = ${sim.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
