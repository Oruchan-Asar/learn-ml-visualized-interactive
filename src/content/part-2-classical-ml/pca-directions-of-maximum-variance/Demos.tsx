"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PCA_POINTS, PCA_DOMAIN, MAX_VARIANCE, projectedVariance, projectedPoints } from "@/lib/math-core/pca";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "pca-directions-of-maximum-variance";
const TOLERANCE = 0.05;

/** Intuition beat: rotate the arrow, watch the projected ticks spread and bunch as variance changes. */
export function IntuitionDemo() {
  const [direction, setDirection] = useState({ x: 3, y: 0 });
  const variance = projectedVariance(PCA_POINTS, direction.x, direction.y);
  const ticks = projectedPoints(PCA_POINTS, direction.x, direction.y);
  return (
    <VectorPlayground
      vectors={[{ ...direction, draggable: true }]}
      onChangeVector={(_, next) => setDirection(next)}
      domain={PCA_DOMAIN}
      cloudPoints={PCA_POINTS}
      projectedPoints={ticks}
      readout={`Variance along this direction = ${variance.toFixed(3)}`}
    />
  );
}

/** Play beat: same control — compare a few angles directly against the discovered maximum. */
export function PlayDemo() {
  const [direction, setDirection] = useState({ x: 0, y: 3 });
  const variance = projectedVariance(PCA_POINTS, direction.x, direction.y);
  const ticks = projectedPoints(PCA_POINTS, direction.x, direction.y);
  const angleDeg = ((Math.atan2(direction.y, direction.x) * 180) / Math.PI + 180) % 180;
  return (
    <VectorPlayground
      vectors={[{ ...direction, draggable: true }]}
      onChangeVector={(_, next) => setDirection(next)}
      domain={PCA_DOMAIN}
      cloudPoints={PCA_POINTS}
      projectedPoints={ticks}
      readout={`Angle ≈ ${angleDeg.toFixed(0)}° — variance = ${variance.toFixed(3)} (max is ${MAX_VARIANCE.toFixed(2)})`}
    />
  );
}

/** Checkpoint: find the direction that maximizes variance — the first principal component. */
export function PcaCheckpoint() {
  const [direction, setDirection] = useState({ x: 3, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const variance = projectedVariance(PCA_POINTS, direction.x, direction.y);
  const ticks = projectedPoints(PCA_POINTS, direction.x, direction.y);

  const passed = withinTolerance(variance, MAX_VARIANCE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Rotate the arrow to find the direction of <strong>maximum variance</strong> — within{" "}
          <strong>0.05</strong> of the best possible, <strong>{MAX_VARIANCE.toFixed(2)}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the arrow to try it"
    >
      <VectorPlayground
        vectors={[{ ...direction, draggable: true }]}
        onChangeVector={(_, next) => {
          setHasInteracted(true);
          setDirection(next);
        }}
        domain={PCA_DOMAIN}
        cloudPoints={PCA_POINTS}
        projectedPoints={ticks}
        passed={passed}
        readout={`Variance along this direction = ${variance.toFixed(3)}`}
      />
    </CheckpointFrame>
  );
}
