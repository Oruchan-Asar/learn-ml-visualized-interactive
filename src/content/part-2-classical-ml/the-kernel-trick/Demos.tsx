"use client";

import { useEffect, useState } from "react";
import { ScatterFitPlayground } from "@/components/viz/ScatterFitPlayground";
import { SplitPlayground } from "@/components/viz/SplitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  KERNEL_POINTS,
  KERNEL_DOMAIN,
  LIFTED_POINTS,
  LIFTED_DOMAIN,
  classificationAccuracy,
  liftedAccuracy,
} from "@/lib/math-core/kernel-trick";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "the-kernel-trick";
const TOLERANCE = 0.01;

/** Intuition beat: try every line — no straight cut through the raw 2D data beats roughly two-thirds accuracy. */
export function IntuitionDemo() {
  const [yLeft, setYLeft] = useState(-2);
  const [yRight, setYRight] = useState(2);
  const accuracy = classificationAccuracy(KERNEL_POINTS, yLeft, yRight, KERNEL_DOMAIN);
  const correct = Math.round(accuracy * KERNEL_POINTS.length);
  return (
    <ScatterFitPlayground
      points={KERNEL_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={KERNEL_DOMAIN}
      yDomain={KERNEL_DOMAIN}
      neutralLine
      readout={`${correct}/${KERNEL_POINTS.length} correct (${(accuracy * 100).toFixed(0)}%) — try to beat it`}
    />
  );
}

/** Play beat: the same data, lifted to z = x^2 + y^2 — now a single threshold does the whole job. */
export function PlayDemo() {
  const [threshold, setThreshold] = useState(4);
  const accuracy = liftedAccuracy(LIFTED_POINTS, threshold);
  return (
    <SplitPlayground
      points={LIFTED_POINTS}
      domain={LIFTED_DOMAIN}
      threshold={threshold}
      onChange={setThreshold}
      readout={`z = ${threshold.toFixed(1)} — ${(accuracy * 100).toFixed(0)}% correct`}
    />
  );
}

/** Checkpoint: find any threshold on the lifted feature that separates every point. */
export function KernelCheckpoint() {
  const [threshold, setThreshold] = useState(4);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const accuracy = liftedAccuracy(LIFTED_POINTS, threshold);

  const passed = withinTolerance(accuracy, 1, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Using the lifted feature — squared radius — drag the split until it separates <strong>every</strong>{" "}
          point: 100% accuracy.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the split line to try it"
    >
      <SplitPlayground
        points={LIFTED_POINTS}
        domain={LIFTED_DOMAIN}
        threshold={threshold}
        onChange={(t) => {
          setHasInteracted(true);
          setThreshold(t);
        }}
        passed={passed}
        readout={`z = ${threshold.toFixed(1)} — ${(accuracy * 100).toFixed(0)}% correct`}
      />
    </CheckpointFrame>
  );
}
