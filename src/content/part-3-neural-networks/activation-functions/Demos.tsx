"use client";

import { useEffect, useState } from "react";
import { ActivationPlayground, type ActivationCurve } from "@/components/viz/ActivationPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  stepFn,
  sigmoid,
  tanhFn,
  relu,
  ACTIVATION_DOMAIN,
  ACTIVATION_RANGE,
  TARGET_SIGMOID_VALUE,
} from "@/lib/math-core/activation-functions";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "activation-functions";
const TOLERANCE = 0.02;

const CURVES: ActivationCurve[] = [
  { fn: stepFn, label: "Step", colorIndex: 0, stepped: true },
  { fn: sigmoid, label: "Sigmoid", colorIndex: 1 },
  { fn: tanhFn, label: "Tanh", colorIndex: 2 },
  { fn: relu, label: "ReLU", colorIndex: 3 },
];

/** Intuition beat: drag the shared input, watch all four react — some clip hard, some curve smoothly, one just folds. */
export function IntuitionDemo() {
  const [x, setX] = useState(-2);
  return (
    <ActivationPlayground
      curves={CURVES}
      domain={ACTIVATION_DOMAIN}
      rangeDomain={ACTIVATION_RANGE}
      value={x}
      onChange={setX}
      readout={`x = ${x.toFixed(2)} — step=${stepFn(x)}, sigmoid=${sigmoid(x).toFixed(2)}, tanh=${tanhFn(x).toFixed(2)}, ReLU=${relu(x).toFixed(2)}`}
    />
  );
}

/** Play beat: same control — pay attention to what happens right around x=0. */
export function PlayDemo() {
  const [x, setX] = useState(0.5);
  return (
    <ActivationPlayground
      curves={CURVES}
      domain={ACTIVATION_DOMAIN}
      rangeDomain={ACTIVATION_RANGE}
      value={x}
      onChange={setX}
      readout={`x = ${x.toFixed(2)} — step=${stepFn(x)}, sigmoid=${sigmoid(x).toFixed(2)}, tanh=${tanhFn(x).toFixed(2)}, ReLU=${relu(x).toFixed(2)}`}
    />
  );
}

/** Checkpoint: find the input where sigmoid saturates to 0.9. */
export function ActivationCheckpoint() {
  const [x, setX] = useState(-2);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const sigmoidValue = sigmoid(x);

  const passed = withinTolerance(sigmoidValue, TARGET_SIGMOID_VALUE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the input until sigmoid&rsquo;s output reaches <strong>{TARGET_SIGMOID_VALUE}</strong> (within{" "}
          <strong>{TOLERANCE}</strong>).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the input to try it"
    >
      <ActivationPlayground
        curves={CURVES}
        domain={ACTIVATION_DOMAIN}
        rangeDomain={ACTIVATION_RANGE}
        value={x}
        onChange={(next) => {
          setHasInteracted(true);
          setX(next);
        }}
        readout={`x = ${x.toFixed(2)} — sigmoid = ${sigmoidValue.toFixed(3)}`}
      />
    </CheckpointFrame>
  );
}
