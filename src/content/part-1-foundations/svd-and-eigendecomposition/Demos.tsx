"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  MATRIX,
  EIGENVECTOR_1,
  transform,
  rotationAngle,
  stretchRatio,
} from "@/lib/math-core/svd-and-eigendecomposition";
import type { Vec2 } from "@/lib/math-core/vectors";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-6, 6];
const START_V: Vec2 = { x: 3, y: -1 };
const CONCEPT_ID = "svd-and-eigendecomposition";
const EIGENVECTOR_TOLERANCE_DEGREES = 2;

/** Intuition beat: drag v, watch Av, and read off the angle A rotates it by. */
export function IntuitionDemo() {
  const [v, setV] = useState(START_V);
  const av = transform(v);
  const angle = rotationAngle(v);
  return (
    <VectorPlayground
      vectors={[
        { ...v, draggable: true },
        { ...av, draggable: false },
      ]}
      onChangeVector={(i, next) => i === 0 && setV(next)}
      domain={DOMAIN}
      readout={`v = (${v.x.toFixed(1)}, ${v.y.toFixed(1)})  →  Av = (${av.x.toFixed(1)}, ${av.y.toFixed(1)})  —  rotated by ${angle.toFixed(1)}°`}
    />
  );
}

/** Play beat: same playground, now also reading off the stretch ratio |Av|/|v|. */
export function PlayDemo() {
  const [v, setV] = useState(START_V);
  const av = transform(v);
  const angle = rotationAngle(v);
  const stretch = stretchRatio(v);
  return (
    <VectorPlayground
      vectors={[
        { ...v, draggable: true },
        { ...av, draggable: false },
      ]}
      onChangeVector={(i, next) => i === 0 && setV(next)}
      domain={DOMAIN}
      readout={`rotation = ${angle.toFixed(1)}°  |  stretch = |Av|/|v| = ${stretch.toFixed(2)}`}
    />
  );
}

/** Checkpoint: drag v until the rotation angle drops below 2° — i.e., find an eigenvector by eye. */
export function EigenvectorCheckpoint() {
  const [v, setV] = useState(START_V);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const av = transform(v);
  const angle = rotationAngle(v);
  const passed = angle < EIGENVECTOR_TOLERANCE_DEGREES;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag <strong>v</strong> until <code>Av</code> points the same direction as <strong>v</strong> —
          angle under 2°. Hint: it&apos;s near the diagonal, like {`(${EIGENVECTOR_1.x.toFixed(2)}, ${EIGENVECTOR_1.y.toFixed(2)})`}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag v to try it"
    >
      <VectorPlayground
        vectors={[
          { ...v, draggable: true },
          { ...av, draggable: false },
        ]}
        onChangeVector={(i, next) => {
          if (i !== 0) return;
          setHasInteracted(true);
          setV(next);
        }}
        domain={DOMAIN}
        passed={passed}
        readout={`rotation = ${angle.toFixed(1)}°  |  A = [[${MATRIX.a}, ${MATRIX.b}], [${MATRIX.c}, ${MATRIX.d}]]`}
      />
    </CheckpointFrame>
  );
}
