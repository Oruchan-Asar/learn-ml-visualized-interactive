"use client";

import { useEffect, useState } from "react";
import { ScatterFitPlayground } from "@/components/viz/ScatterFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  SVM_POINTS,
  SVM_X_DOMAIN,
  SVM_Y_DOMAIN,
  BEST_MARGIN,
  evaluateMargin,
  marginLineEndpoints,
} from "@/lib/math-core/svm";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "support-vector-machines";
const TOLERANCE = 0.05;

function useLine(initialLeft: number, initialRight: number) {
  const [yLeft, setYLeft] = useState(initialLeft);
  const [yRight, setYRight] = useState(initialRight);
  const result = evaluateMargin(SVM_POINTS, yLeft, yRight, SVM_X_DOMAIN);
  const { aLine, bLine } = marginLineEndpoints(result, SVM_X_DOMAIN);
  return { yLeft, setYLeft, yRight, setYRight, result, marginLines: result.separates ? [aLine, bLine] : undefined };
}

/** Intuition beat: drag either end, watch the street widen and narrow, watch it break when the line stops separating. */
export function IntuitionDemo() {
  const { yLeft, setYLeft, yRight, setYRight, result, marginLines } = useLine(4, 6);
  return (
    <ScatterFitPlayground
      points={SVM_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={SVM_X_DOMAIN}
      yDomain={SVM_Y_DOMAIN}
      neutralLine
      marginLines={marginLines}
      readout={
        result.separates
          ? `Street width = ${result.streetWidth.toFixed(2)}`
          : "Not separating — the line cuts through a class"
      }
    />
  );
}

/** Play beat: both margins shown separately, so an off-center line's asymmetry is visible before it's fixed. */
export function PlayDemo() {
  const { yLeft, setYLeft, yRight, setYRight, result, marginLines } = useLine(3, 6);
  return (
    <ScatterFitPlayground
      points={SVM_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={SVM_X_DOMAIN}
      yDomain={SVM_Y_DOMAIN}
      neutralLine
      marginLines={marginLines}
      readout={
        result.separates
          ? `marginA = ${result.marginA.toFixed(2)}, marginB = ${result.marginB.toFixed(2)}, width = ${result.streetWidth.toFixed(2)}`
          : "Not separating — the line cuts through a class"
      }
    />
  );
}

/** Checkpoint: widen the street to the true maximum-margin separator. */
export function SvmCheckpoint() {
  const { yLeft, setYLeft, yRight, setYRight, result, marginLines } = useLine(4, 6);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = withinTolerance(result.streetWidth, BEST_MARGIN.streetWidth, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag both ends of the line to separate the two classes with the widest possible street — within{" "}
          <strong>0.05</strong> of the best possible width, <strong>{BEST_MARGIN.streetWidth.toFixed(2)}</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag either end of the line to try it"
    >
      <ScatterFitPlayground
        points={SVM_POINTS}
        yLeft={yLeft}
        yRight={yRight}
        onChangeLeft={(y) => {
          setHasInteracted(true);
          setYLeft(y);
        }}
        onChangeRight={(y) => {
          setHasInteracted(true);
          setYRight(y);
        }}
        xDomain={SVM_X_DOMAIN}
        yDomain={SVM_Y_DOMAIN}
        neutralLine
        marginLines={marginLines}
        passed={passed}
        readout={
          result.separates
            ? `Street width = ${result.streetWidth.toFixed(2)}`
            : "Not separating — the line cuts through a class"
        }
      />
    </CheckpointFrame>
  );
}
