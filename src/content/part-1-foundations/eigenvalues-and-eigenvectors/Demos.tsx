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
} from "@/lib/math-core/eigenvalues-and-eigenvectors";
import type { Vec2 } from "@/lib/math-core/vectors";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const DOMAIN: [number, number] = [-6, 6];
const START_V: Vec2 = { x: 3, y: -1 };
const CONCEPT_ID = "eigenvalues-and-eigenvectors";
const ANGLE_TOLERANCE_DEGREES = 2;
const STRETCH_TOLERANCE = 0.3;

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

/**
 * Checkpoint: this matrix has two eigenvector directions, both with angle ~0 (both eigenvalues are
 * positive). Requiring the stretch ratio to also match 5 picks out specifically the eigenvalue-5
 * eigenvector, not the eigenvalue-2 one.
 */
export function EigenvectorCheckpoint() {
  const [v, setV] = useState(START_V);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const av = transform(v);
  const angle = rotationAngle(v);
  const stretch = stretchRatio(v);
  const passed = angle < ANGLE_TOLERANCE_DEGREES && Math.abs(stretch - 5) < STRETCH_TOLERANCE;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          This matrix has two eigenvector directions (both with rotation angle 0). Drag <strong>v</strong>{" "}
          until <code>Av</code> points the same direction as <strong>v</strong> <em>and</em> the stretch
          ratio is <strong>5</strong> — that picks out the eigenvector for the <em>larger</em> eigenvalue.
          Hint: it&apos;s near {`(${EIGENVECTOR_1.x}, ${EIGENVECTOR_1.y})`}.
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
        readout={`rotation = ${angle.toFixed(1)}°  |  stretch = ${stretch.toFixed(2)}  |  A = [[${MATRIX.a}, ${MATRIX.b}], [${MATRIX.c}, ${MATRIX.d}]]`}
      />
    </CheckpointFrame>
  );
}
