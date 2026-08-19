"use client";

import { useEffect, useState } from "react";
import { ScatterFitPlayground } from "@/components/viz/ScatterFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DATA_POINTS, sumSquaredError } from "@/lib/math-core/linear-regression";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const X_DOMAIN: [number, number] = [0, 10];
const Y_DOMAIN: [number, number] = [0, 20];
const CONCEPT_ID = "linear-regression-fitting-a-line";
const SSE_THRESHOLD = 2.0;
const START_Y = 5; // a deliberately bad flat-line starting fit

function useLine() {
  const [yLeft, setYLeft] = useState(START_Y);
  const [yRight, setYRight] = useState(START_Y);
  const slope = (yRight - yLeft) / (X_DOMAIN[1] - X_DOMAIN[0]);
  const intercept = yLeft;
  return { yLeft, setYLeft, yRight, setYRight, slope, intercept };
}

/** Intuition beat: just drag the line and watch the residual gaps open and close. */
export function IntuitionDemo() {
  const { yLeft, setYLeft, yRight, setYRight } = useLine();
  return (
    <ScatterFitPlayground
      points={DATA_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={X_DOMAIN}
      yDomain={Y_DOMAIN}
      showResiduals
    />
  );
}

/** Play beat: same interaction, now with w, b, and the total squared error read out live. */
export function PlayDemo() {
  const { yLeft, setYLeft, yRight, setYRight, slope, intercept } = useLine();
  const sse = sumSquaredError(DATA_POINTS, slope, intercept);
  return (
    <ScatterFitPlayground
      points={DATA_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={X_DOMAIN}
      yDomain={Y_DOMAIN}
      showResiduals
      readout={`w = ${slope.toFixed(2)}, b = ${intercept.toFixed(2)}, SSE = ${sse.toFixed(2)}`}
    />
  );
}

/** Checkpoint: drag the line until the total squared error drops below a threshold. */
export function FitCheckpoint() {
  const { yLeft, setYLeft, yRight, setYRight, slope, intercept } = useLine();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const sse = sumSquaredError(DATA_POINTS, slope, intercept);
  const passed = sse <= SSE_THRESHOLD;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag either end of the line until the total squared error, <code>SSE</code>, drops below{" "}
          <strong>2.0</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag either end of the line to try it"
    >
      <ScatterFitPlayground
        points={DATA_POINTS}
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
        xDomain={X_DOMAIN}
        yDomain={Y_DOMAIN}
        showResiduals
        passed={passed}
        readout={`SSE = ${sse.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
