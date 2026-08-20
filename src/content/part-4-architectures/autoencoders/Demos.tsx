"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  POINTS,
  DOMAIN,
  ANGLE_DOMAIN,
  MIN_ERROR,
  TARGET_ERROR,
  reconstructedPoints,
  reconstructionError,
  reconstructionErrorDerivative,
} from "@/lib/math-core/autoencoders";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "autoencoders";
const DIRECTION_LENGTH = 3;

function angleFromVector(v: { x: number; y: number }): number {
  return Math.atan2(v.y, v.x);
}

/** Intuition beat: drag the bottleneck direction — every point snaps to its nearest spot on that one line. */
export function IntuitionDemo() {
  const [angle, setAngle] = useState(0.3);
  const direction = { x: Math.cos(angle) * DIRECTION_LENGTH, y: Math.sin(angle) * DIRECTION_LENGTH, draggable: true };
  const error = reconstructionError(POINTS, angle);
  return (
    <VectorPlayground
      vectors={[direction]}
      onChangeVector={(_, next) => setAngle(angleFromVector(next))}
      domain={DOMAIN}
      cloudPoints={POINTS}
      projectedPoints={reconstructedPoints(POINTS, angle)}
      readout={`bottleneck direction — mean squared reconstruction error = ${error.toFixed(3)}`}
    />
  );
}

/** Play beat: the same trade-off as a curve — drag along it to see how error changes with the chosen direction. */
export function PlayDemo() {
  const [angle, setAngle] = useState(1.2);
  return (
    <CurvePlayground
      fn={(a) => reconstructionError(POINTS, a)}
      derivative={(a) => reconstructionErrorDerivative(POINTS, a)}
      domain={ANGLE_DOMAIN}
      value={angle}
      onChange={setAngle}
      readout={`angle = ${angle.toFixed(2)} rad — reconstruction error = ${reconstructionError(POINTS, angle).toFixed(3)}`}
    />
  );
}

/** Checkpoint: find the bottleneck direction that minimizes reconstruction error — Part II's principal direction. */
export function AutoencoderCheckpoint() {
  const [angle, setAngle] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const error = reconstructionError(POINTS, angle);

  const passed = withinTolerance(error, MIN_ERROR, TARGET_ERROR - MIN_ERROR);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const direction = { x: Math.cos(angle) * DIRECTION_LENGTH, y: Math.sin(angle) * DIRECTION_LENGTH, draggable: true };

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the bottleneck direction until the reconstruction error drops to within{" "}
          <strong>{(TARGET_ERROR - MIN_ERROR).toFixed(2)}</strong> of the best possible value,{" "}
          <strong>{MIN_ERROR.toFixed(3)}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the direction to try it"
    >
      <VectorPlayground
        vectors={[direction]}
        onChangeVector={(_, next) => {
          setHasInteracted(true);
          setAngle(angleFromVector(next));
        }}
        domain={DOMAIN}
        cloudPoints={POINTS}
        projectedPoints={reconstructedPoints(POINTS, angle)}
        passed={passed}
        readout={`reconstruction error = ${error.toFixed(3)}`}
      />
    </CheckpointFrame>
  );
}
