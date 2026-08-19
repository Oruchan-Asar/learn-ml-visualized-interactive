"use client";

import { useEffect, useState } from "react";
import { ScatterFitPlayground } from "@/components/viz/ScatterFitPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { OUTLIER_DATA_POINTS, meanSquaredError, meanAbsoluteError } from "@/lib/math-core/linear-regression";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const X_DOMAIN: [number, number] = [0, 10];
const Y_DOMAIN: [number, number] = [0, 22];
const CONCEPT_ID = "loss-functions-mse-vs-mae";
const MAE_THRESHOLD = 4.0;
const START_Y = 5;

function useLine() {
  const [yLeft, setYLeft] = useState(START_Y);
  const [yRight, setYRight] = useState(START_Y);
  const slope = (yRight - yLeft) / (X_DOMAIN[1] - X_DOMAIN[0]);
  const intercept = yLeft;
  return { yLeft, setYLeft, yRight, setYRight, slope, intercept };
}

/** Intuition beat: no formula yet — just watch the outlier's residual dwarf the others. */
export function IntuitionDemo() {
  const { yLeft, setYLeft, yRight, setYRight } = useLine();
  return (
    <ScatterFitPlayground
      points={OUTLIER_DATA_POINTS}
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

/** Play beat: same interaction, now with both MSE and MAE read out side by side. */
export function PlayDemo() {
  const { yLeft, setYLeft, yRight, setYRight, slope, intercept } = useLine();
  const mse = meanSquaredError(OUTLIER_DATA_POINTS, slope, intercept);
  const mae = meanAbsoluteError(OUTLIER_DATA_POINTS, slope, intercept);
  return (
    <ScatterFitPlayground
      points={OUTLIER_DATA_POINTS}
      yLeft={yLeft}
      yRight={yRight}
      onChangeLeft={setYLeft}
      onChangeRight={setYRight}
      xDomain={X_DOMAIN}
      yDomain={Y_DOMAIN}
      showResiduals
      readout={`MSE = ${mse.toFixed(2)}   MAE = ${mae.toFixed(2)}`}
    />
  );
}

/** Checkpoint: fit the line so MAE drops below a threshold, despite the outlier. */
export function LossCheckpoint() {
  const { yLeft, setYLeft, yRight, setYRight, slope, intercept } = useLine();
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const mse = meanSquaredError(OUTLIER_DATA_POINTS, slope, intercept);
  const mae = meanAbsoluteError(OUTLIER_DATA_POINTS, slope, intercept);
  const passed = mae <= MAE_THRESHOLD;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Fit the line so <code>MAE</code> drops below <strong>4.0</strong> — notice <code>MSE</code> won&rsquo;t
          cooperate nearly as easily, no matter where you put the line.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag either end of the line to try it"
    >
      <ScatterFitPlayground
        points={OUTLIER_DATA_POINTS}
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
        readout={`MSE = ${mse.toFixed(2)}   MAE = ${mae.toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
